import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../utils/database';
import { User, UserResponse } from '../models/User';

const router = express.Router();

// Register new user
router.post('/signup', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validate input
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role are required' });
    }

    if (!['donor', 'hospital'].includes(role)) {
      return res.status(400).json({ error: 'Role must be either donor or hospital' });
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, role) 
       VALUES ($1, $2, $3) 
       RETURNING id, email, role, profile_completed`,
      [email, passwordHash, role]
    );

    const user = userResult.rows[0];

    // Create profile based on role
    if (role === 'donor') {
      await pool.query(
        'INSERT INTO donors (user_id) VALUES ($1)',
        [user.id]
      );
    } else if (role === 'hospital') {
      await pool.query(
        'INSERT INTO hospitals (user_id, name) VALUES ($1, $2)',
        [user.id, 'New Hospital']
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    const userResponse: UserResponse = {
      id: user.id,
      email: user.email,
      role: user.role,
      profile_completed: user.profile_completed
    };

    res.status(201).json({
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Find user
    const userResult = await pool.query(
      `SELECT id, email, password_hash, role, profile_completed 
       FROM users WHERE email = $1 AND role = $2`,
      [email, role]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    const userResponse: UserResponse = {
      id: user.id,
      email: user.email,
      role: user.role,
      profile_completed: user.profile_completed
    };

    res.json({
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;