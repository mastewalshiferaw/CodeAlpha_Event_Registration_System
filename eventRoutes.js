const express = require('express');
const router = express.Router();
const Event = require('../models/Event'); // Import our Event model


router.get('/', async (req, res) => {
  try {
    // Query MongoDB: find all events and sort them by date ascending
    const events = await Event.find().sort({ date: 1 });
    
    // Return 200 OK status with the JSON list of events
    res.status(200).json(events);
  } catch (error) {
    // 500 = Internal Server Error
    res.status(500).json({ message: 'Error fetching events', error: error.message });
  }
});

// ==========================================
// 2. GET A SINGLE EVENT BY ID
// Equivalent Django: get_object_or_404(Event, id=id)
// ==========================================
router.get('/:id', async (req, res) => {
  try {
    // req.params.id gets the :id variable from the URL
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching event details', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    // req.body contains JSON payload sent in POST request (like request.POST in Django)
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
    res.status(400).json({ message: 'Invalid event data', error: error.message });
  }
});

module.exports = router;