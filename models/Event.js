const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  category: { type: String, default: 'Tech' },
  organizer: { type: String, default: 'CodeAlpha Events' },
  price: { type: String, default: 'Free' },
  imageUrl: { type: String, default: '' },
  capacity: { type: Number, required: true, min: 1 },
  availableSeats: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', eventSchema);