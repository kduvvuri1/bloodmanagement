import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { pool } from '../utils/database';
import { PatientRequest } from '../models/Patient';

const router = express.Router();

// Get all patients for a hospital
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT p.* FROM patients p
       JOIN hospitals h ON p.hospital_id = h.id
       WHERE h.user_id = $1
       ORDER BY p.urgency_level DESC, p.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// Create new patient blood request
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const patientData: PatientRequest = req.body;

    // Get hospital ID from user ID
    const hospitalResult = await pool.query(
      'SELECT id FROM hospitals WHERE user_id = $1',
      [userId]
    );

    if (hospitalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Hospital profile not found' });
    }

    const hospitalId = hospitalResult.rows[0].id;

    const result = await pool.query(
      `INSERT INTO patients (
        hospital_id, patient_name, blood_type, condition, 
        urgency_level, units_required, required_date, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        hospitalId,
        patientData.patientName,
        patientData.bloodType,
        patientData.condition,
        patientData.urgencyLevel,
        patientData.unitsRequired,
        patientData.requiredDate,
        patientData.notes
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Patient blood request created successfully',
      patient: result.rows[0]
    });

  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({ error: 'Failed to create patient request' });
  }
});

// Update patient status
router.put('/:id/status', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const patientId = req.params.id;
    const { status } = req.body;

    if (!['pending', 'fulfilled', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      `UPDATE patients 
       SET status = $1, 
           fulfilled_date = CASE WHEN $1 = 'fulfilled' THEN NOW() ELSE fulfilled_date END,
           updated_at = NOW()
       FROM hospitals h
       WHERE patients.id = $2 
         AND patients.hospital_id = h.id 
         AND h.user_id = $3
       RETURNING patients.*`,
      [status, patientId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found or access denied' });
    }

    res.json({
      success: true,
      message: `Patient status updated to ${status}`,
      patient: result.rows[0]
    });

  } catch (error) {
    console.error('Update patient status error:', error);
    res.status(500).json({ error: 'Failed to update patient status' });
  }
});

// Delete patient
router.delete('/:id', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const patientId = req.params.id;

    const result = await pool.query(
      `DELETE FROM patients 
       USING hospitals 
       WHERE patients.id = $1 
         AND patients.hospital_id = hospitals.id 
         AND hospitals.user_id = $2
       RETURNING patients.*`,
      [patientId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found or access denied' });
    }

    res.json({
      success: true,
      message: 'Patient deleted successfully'
    });

  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});

// Get patient statistics
router.get('/stats', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT 
         COUNT(*) as total_requests,
         COUNT(CASE WHEN status = 'fulfilled' THEN 1 END) as fulfilled_requests,
         COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_requests,
         AVG(urgency_level) as avg_urgency,
         blood_type,
         COUNT(*) as blood_type_count
       FROM patients p
       JOIN hospitals h ON p.hospital_id = h.id
       WHERE h.user_id = $1
       GROUP BY blood_type`,
      [userId]
    );

    const stats = {
      totalRequests: parseInt(result.rows[0]?.total_requests || 0),
      fulfilledRequests: parseInt(result.rows[0]?.fulfilled_requests || 0),
      pendingRequests: parseInt(result.rows[0]?.pending_requests || 0),
      avgUrgency: parseFloat(result.rows[0]?.avg_urgency || 0),
      bloodTypeDistribution: result.rows.map(row => ({
        bloodType: row.blood_type,
        count: parseInt(row.blood_type_count)
      }))
    };

    res.json(stats);
  } catch (error) {
    console.error('Get patient stats error:', error);
    res.status(500).json({ error: 'Failed to fetch patient statistics' });
  }
});

export default router;