const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const Event = require('../models/Event');


//REGISTER FOR AN EVENT

router.post('/', async (req, res) => {
  try {
    const { eventId, userName, userEmail, userPhone } = req.body;

    //Check if the event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event does not exist.' });
    }

    //Check if seats are available
    if (event.availableSeats <= 0) {
      return res.status(400).json({ message: 'Sorry, this event is fully booked!' });
    }

    //Check if user has already booked this event
    const existingRegistration = await Registration.findOne({
      event: eventId,
      userEmail: userEmail.toLowerCase(),
      status: 'CONFIRMED'
    });

    if (existingRegistration) {
      return res.status(400).json({ message: 'You are already registered for this event.' });
    }

    //Create and save the registration
    const registration = new Registration({
      event: eventId,
      userName,
      userEmail,
      userPhone
    });
    await registration.save();

    //Decrement available seats by 1
    event.availableSeats -= 1;
    await event.save();

    res.status(201).json({
      message: 'Registration successful!',
      registration
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

//VIEW USER REGISTRATIONS BY EMAIL
router.get('/user/:email', async (req, res) => {
  try {
    const email = req.params.email.toLowerCase();

  
    const userRegistrations = await Registration.find({ userEmail: email })
      .populate('event')
      .sort({ registrationDate: -1 });

    res.status(200).json(userRegistrations);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving registrations', error: error.message });
  }
});


//CANCEL A REGISTRATION

router.patch('/:id/cancel', async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    if (registration.status === 'CANCELLED') {
      return res.status(400).json({ message: 'Registration has already been cancelled.' });
    }

    // Mark as cancelled
    registration.status = 'CANCELLED';
    await registration.save();

    // Give the seat back to the event
    const event = await Event.findById(registration.event);
    if (event) {
      event.availableSeats += 1;
      await event.save();
    }

    res.status(200).json({
      message: 'Registration cancelled successfully',
      registration
    });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling registration', error: error.message });
  }
});

module.exports = router;