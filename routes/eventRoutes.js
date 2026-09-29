const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');
const { requireAuth, requireRole } = require('../middleware/auth');


router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events', error: error.message });
  }
});


router.get('/admin/stats', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const totalEvents = await Event.countDocuments();
    const totalRegistrations = await Registration.countDocuments();
    const totalUsers = await User.countDocuments();
    const activeConfirmed = await Registration.countDocuments({ status: 'CONFIRMED' });

    res.status(200).json({
      totalEvents,
      totalRegistrations,
      totalUsers,
      activeConfirmed
    });
  } catch (err) {
    res.status(500).json({ message: 'Error loading admin stats', error: err.message });
  }
});


router.post('/', requireAuth, requireRole('ORGANIZER', 'ADMIN'), async (req, res) => {
  try {
    const { title, description, date, location, category, organizer, price, capacity, imageUrl } = req.body;
    const newEvent = new Event({
      title,
      description,
      date,
      location,
      category: category || 'Tech',
      organizer: organizer ? organizer.trim() : req.user.name,
      organizerId: req.user.id,
      price: price ? price.trim() : 'Free',
      imageUrl: imageUrl ? imageUrl.trim() : '',
      capacity: Number(capacity),
      availableSeats: Number(capacity)
    });
    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data: ' + error.message });
  }
});

router.delete('/:id', requireAuth, requireRole('ORGANIZER', 'ADMIN'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const isAdmin = req.user.role === 'ADMIN';
    const isOwner = event.organizerId && String(event.organizerId) === String(req.user.id);
    const isLegacy = !event.organizerId; // Events created before auth

    if (!isAdmin && !isOwner && !isLegacy) {
      return res.status(403).json({ message: 'Unauthorized: You can only delete your own events.' });
    }

    await Event.findByIdAndDelete(req.params.id);
    await Registration.deleteMany({ event: req.params.id });

    res.status(200).json({ message: 'Event and linked registrations deleted permanently.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting event: ' + error.message });
  }
});

// 5. VIEW ATTENDEES ROSTER
router.get('/:id/attendees', requireAuth, requireRole('ORGANIZER', 'ADMIN'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const isAdmin = req.user.role === 'ADMIN';
    const isOwner = event.organizerId && String(event.organizerId) === String(req.user.id);
    const isLegacy = !event.organizerId;

    if (!isAdmin && !isOwner && !isLegacy) {
      return res.status(403).json({ message: 'Unauthorized: You can only view rosters for your own events.' });
    }

    const attendees = await Registration.find({ event: req.params.id }).sort({ registrationDate: -1 });
    res.status(200).json(attendees);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching roster', error: error.message });
  }
});

module.exports = router;