const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Registration = require('../models/Registration');
const Event = require('../models/Event');

// 1. REGISTER FOR AN EVENT
router.post('/', async (req, res) => {
  try {
    const { eventId, userName, userEmail, userPhone } = req.body;

    // Validate inputs
    if (!eventId || !userName || !userEmail || !userPhone) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid Event ID.' });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // Check seat availability
    if (event.availableSeats <= 0) {
      return res.status(400).json({ message: 'Sorry, this event is sold out!' });
    }

    // Check duplicate registration
    const existing = await Registration.findOne({
      event: eventId,
      userEmail: userEmail.toLowerCase().trim(),
      status: 'CONFIRMED'
    });

    if (existing) {
      return res.status(400).json({ message: 'You already have an active pass for this event.' });
    }

    // Create registration
    const registration = new Registration({
      event: eventId,
      userName: userName.trim(),
      userEmail: userEmail.toLowerCase().trim(),
      userPhone: userPhone.trim()
    });

    await registration.save();

    // Decrement available seat
    event.availableSeats = Math.max(0, event.availableSeats - 1);
    await event.save();

    res.status(201).json({
      message: 'Registration confirmed successfully!',
      registration
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Server error during registration: ' + error.message });
  }
});

// 2. VIEW USER REGISTRATIONS
router.get('/user/:email', async (req, res) => {
  try {
    const email = req.params.email.toLowerCase().trim();
    const list = await Registration.find({ userEmail: email })
      .populate('event')
      .sort({ registrationDate: -1 });

    res.status(200).json(list);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving registrations', error: error.message });
  }
});

// 3. CANCEL REGISTRATION
router.patch('/:id/cancel', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid registration ID.' });
    }

    const reg = await Registration.findById(req.params.id);
    if (!reg) return res.status(404).json({ message: 'Registration not found' });
    if (reg.status === 'CANCELLED') {
      return res.status(400).json({ message: 'Registration is already cancelled' });
    }

    reg.status = 'CANCELLED';
    await reg.save();

    const event = await Event.findById(reg.event);
    if (event) {
      event.availableSeats += 1;
      await event.save();
    }

    res.status(200).json({ message: 'Pass cancelled successfully', registration: reg });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling pass', error: error.message });
  }
});

module.exports = router;