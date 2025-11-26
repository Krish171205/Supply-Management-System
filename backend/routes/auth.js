const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const authMiddleware = require('../middleware/auth');
const { adminOnly } = require('../middleware/authorization');

const router = express.Router();

// Helper to generate random password
const generateRandomPassword = () => {
  return Math.random().toString(36).slice(-12);
};

// Login endpoint (name + password)
router.post('/login', async (req, res) => {
  try {
    const { name, password } = req.body;

    // Validate inputs
    if (!name || !password) {
      return res.status(400).json({ message: 'Name and password are required' });
    }

    if (typeof name !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Name and password must be strings' });
    }

    const user = await User.findOne({ where: { name } });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.is_active) {
      return res.status(401).json({ message: 'User account is inactive' });
    }

    const isPasswordValid = await user.verifyPassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured in environment variables');
    }

    // Update last login
    user.last_login = new Date();
    await user.save();

    const tokenPayload = { id: user.id, email: user.email, role: user.role };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// Create user account (admin only)
router.post('/create-user', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, email, phone, role = 'supplier', password } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    if (!email && !phone) {
      return res.status(400).json({ message: 'At least email or phone is required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Validate email format if provided
    if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    // Validate phone format if provided (must be exactly 10 digits)
    if (phone && !phone.match(/^\d{10}$/)) {
      return res.status(400).json({ message: 'Invalid phone number. Must be exactly 10 digits.' });
    }

    // Check if email already exists
    if (email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    const user = await User.create({
      name,
      email: email || null,
      phone: phone || null,
      role,
      hashed_password: password,
      is_active: true
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        is_active: user.is_active
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

// Get current user profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        is_active: user.is_active,
        last_login: user.last_login
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (password) user.hashed_password = password; // Will be hashed by the hook

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

// Alias endpoint for frontend: create-supplier (admin only)
router.post('/create-supplier', authMiddleware, adminOnly, async (req, res) => {
    console.log('CREATE SUPPLIER REQUEST BODY:', req.body);
  try {
    const { email, password, name, phone } = req.body;

    // Validate inputs
    if (!email && !phone) {
      return res.status(400).json({ message: 'At least email or phone is required' });
    }

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    // Validate email format if provided
    if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    // Validate phone format if provided (must be exactly 10 digits)
    if (phone && !phone.match(/^\d{10}$/)) {
      return res.status(400).json({ message: 'Invalid phone number. Must be exactly 10 digits.' });
    }
    // Check if email already exists
    if (email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    const user = await User.create({
      name: name || (email ? email.split('@')[0] : 'Supplier'),
      email: email || null,
      phone: phone || null,
      role: 'supplier',
      hashed_password: password,
      is_active: true
    });

    // Send supplier credentials email if email is provided
    if (email) {
      try {
        const { sendTestEmail } = require('../config/email');
        await sendTestEmail(email, { type: 'supplier', username: user.name, password });
      } catch (err) {
        console.error('Error sending supplier email:', err);
      }
    }

    res.status(201).json({
      message: 'Supplier created successfully',
      credentials: {
        email: user.email,
        password: password,
        name: user.name
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(500).json({ message: 'Error creating supplier', error: error.message });
  }
});

module.exports = router;
