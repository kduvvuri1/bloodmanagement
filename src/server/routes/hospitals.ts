import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { pool } from '../utils/database';

const router = express.Router();

// Get hospital profile
router.get('/profile', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT h.* FROM hospitals h
       JOIN users u ON h.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Hospital profile not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get hospital profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update hospital profile
router.put('/profile', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const profileData = req.body;

    const result = await pool.query(
      `UPDATE hospitals SET
        name = $1, address = $2, city = $3, state = $4, zip_code = $5,
        phone_number = $6, email = $7, latitude = $8, longitude = $9,
        operating_hours = $10, updated_at = NOW()
       WHERE user_id = $11
       RETURNING *`,
      [
        profileData.name, profileData.address, profileData.city,
        profileData.state, profileData.zipCode, profileData.phoneNumber,
        profileData.email, profileData.latitude, profileData.longitude,
        profileData.operatingHours, userId
      ]
    );

    // Mark profile as completed
    await pool.query(
      'UPDATE users SET profile_completed = true WHERE id = $1',
      [userId]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      hospital: result.rows[0]
    });

  } catch (error) {
    console.error('Update hospital profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get all hospitals for map
router.get('/map', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, address, city, state, zip_code, 
              latitude, longitude, blood_urgency_level
       FROM hospitals 
       WHERE latitude IS NOT NULL AND longitude IS NOT NULL`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get hospitals for map error:', error);
    res.status(500).json({ error: 'Failed to fetch hospitals' });
  }
});

// Update hospital urgency level
router.put('/urgency', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { urgencyLevel } = req.body;

    if (urgencyLevel < 1 || urgencyLevel > 5) {
      return res.status(400).json({ error: 'Urgency level must be between 1 and 5' });
    }

    const result = await pool.query(
      `UPDATE hospitals SET blood_urgency_level = $1, updated_at = NOW()
       WHERE user_id = $2
       RETURNING *`,
      [urgencyLevel, userId]
    );

    res.json({
      success: true,
      message: 'Urgency level updated successfully',
      hospital: result.rows[0]
    });

  } catch (error) {
    console.error('Update urgency level error:', error);
    res.status(500).json({ error: 'Failed to update urgency level' });
  }
});

export default router;