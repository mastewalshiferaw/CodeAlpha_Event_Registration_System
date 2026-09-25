const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event', 
    required: true
  },
  userName: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  userEmail: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true
  },
  userPhone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['CONFIRMED', 'CANCELLED'],
    default: 'CONFIRMED'
  }
});

module.exports = mongoose.model('Registration', registrationSchema);