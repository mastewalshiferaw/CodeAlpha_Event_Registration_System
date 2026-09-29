const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET, requireAuth } = require('../middleware/auth');

// 1. SIGN UP
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, organization, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = (role && ['ATTENDEE', 'ORGANIZER', 'ADMIN'].includes(role.toUpperCase())) 
      ? role.toUpperCase() 
      : 'ORGANIZER';

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      organization: organization ? organization.trim() : 'Independent',
      role: userRole
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: `${user.role} account created successfully!`,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, organization: user.organization }
    });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed: ' + err.message });
  }
});

// 2. LOG IN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: `Welcome back, ${user.name}!`,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, organization: user.organization }
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed: ' + err.message });
  }
});

module.exports = router;