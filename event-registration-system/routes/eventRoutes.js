const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

// GET all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events', error: error.message });
  }
});

// GET single event by ID
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching event', error: error.message });
  }
});

// CREATE new event
router.post('/', async (req, res) => {
  try {
    const { title, description, date, location, category, capacity } = req.body;
    const newEvent = new Event({
      title,
      description,
      date,
      location,
      category: category || 'General',
      capacity: Number(capacity),
      availableSeats: Number(capacity)
    });
    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', error: error.message });
  }
});

module.exports = router;