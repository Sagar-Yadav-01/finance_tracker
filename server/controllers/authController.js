const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const getJwtSecret = () => process.env.JWT_SECRET || 'replace_with_a_long_random_secret';

/**
 * POST /api/auth/signup
 */
const signup = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const sanitizedEmail = email.trim().toLowerCase();

    // Check duplicate email
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [sanitizedEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    // Hash password with bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name.trim(), sanitizedEmail, passwordHash]
    );

    const userId = result.insertId;
    const userPayload = { id: userId, email: sanitizedEmail, name: name.trim() };

    // Generate JWT
    const token = jwt.sign(userPayload, getJwtSecret(), { expiresIn: '7d' });

    return res.status(201).json({
      message: 'Signup successful',
      token,
      user: userPayload
    });
  } catch (err) {
    console.error('[SIGNUP ERROR]', err);
    return res.status(500).json({ message: 'Database error during signup. Please ensure MySQL is running.' });
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const sanitizedEmail = email.trim().toLowerCase();

    // Query user
    const [users] = await pool.query(
      'SELECT id, name, email, password_hash FROM users WHERE email = ?',
      [sanitizedEmail]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const userPayload = { id: user.id, email: user.email, name: user.name };
    const token = jwt.sign(userPayload, getJwtSecret(), { expiresIn: '7d' });

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: userPayload
    });
  } catch (err) {
    console.error('[LOGIN ERROR]', err);
    return res.status(500).json({ message: 'Database error during login. Please ensure MySQL is running.' });
  }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User profile not found.' });
    }

    const user = users[0];
    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.created_at
      }
    });
  } catch (err) {
    console.error('[GET ME ERROR]', err);
    return res.status(500).json({ message: 'Database error fetching user profile.' });
  }
};

module.exports = {
  signup,
  login,
  getMe
};
