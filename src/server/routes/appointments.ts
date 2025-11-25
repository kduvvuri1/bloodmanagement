import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { pool } from '../utils/database';

const router = express.Router();

// Create new appointment
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { hospitalId, appointmentDate, bloodType } = req.body;

    // Get donor ID from user ID
    const donorResult = await pool.query(
      'SELECT id FROM donors WHERE user_id = $1',
      [userId]
    );

    if (donorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Donor profile not found' });
    }

    const donorId = donorResult.rows[0].id;

    const result = await pool.query(
      `INSERT INTO appointments (donor_id, hospital_id, appointment_date, blood_type)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [donorId, hospitalId, appointmentDate, bloodType]
    );

    res.status(201).json({
      success: true,
      message: 'Appointment scheduled successfully',
      appointment: result.rows[0]
    });

  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: 'Failed to schedule appointment' });
  }
});

// Get hospital appointments
router.get('/hospital', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT a.*, d.first_name, d.last_name, d.blood_type
       FROM appointments a
       JOIN donors d ON a.donor_id = d.id
       JOIN hospitals h ON a.hospital_id = h.id
       WHERE h.user_id = $1
       ORDER BY a.appointment_date ASC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get hospital appointments error:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

export default router;