import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { pool } from '../utils/database';
import { Donor, DonorProfileData } from '../models/Donor';

const router = express.Router();

// Get donor profile
router.get('/profile', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT d.* FROM donors d
       JOIN users u ON d.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Donor profile not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get donor profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update donor profile
router.put('/profile', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const profileData: DonorProfileData = req.body;

    const result = await pool.query(
      `UPDATE donors SET
        first_name = $1, last_name = $2, date_of_birth = $3, gender = $4,
        phone_number = $5, street = $6, city = $7, state = $8, zip_code = $9,
        blood_type = $10, weight = $11, height = $12, has_chronic_illness = $13,
        chronic_illness_details = $14, has_traveled = $15, travel_details = $16,
        has_tattoo = $17, tattoo_details = $18, is_on_medication = $19,
        medication_details = $20, emergency_contact_name = $21,
        emergency_contact_phone = $22, emergency_contact_relationship = $23,
        updated_at = NOW()
       WHERE user_id = $24
       RETURNING *`,
      [
        profileData.firstName, profileData.lastName, profileData.dateOfBirth,
        profileData.gender, profileData.phoneNumber, profileData.street,
        profileData.city, profileData.state, profileData.zipCode,
        profileData.bloodType, profileData.weight, profileData.height,
        profileData.hasChronicIllness, profileData.chronicIllnessDetails,
        profileData.hasTraveled, profileData.travelDetails, profileData.hasTattoo,
        profileData.tattooDetails, profileData.isOnMedication,
        profileData.medicationDetails, profileData.emergencyContactName,
        profileData.emergencyContactPhone, profileData.emergencyContactRelationship,
        userId
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
      donor: result.rows[0]
    });

  } catch (error) {
    console.error('Update donor profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get donor appointments
router.get('/appointments', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT a.*, h.name as hospital_name, h.address as hospital_address
       FROM appointments a
       JOIN hospitals h ON a.hospital_id = h.id
       JOIN donors d ON a.donor_id = d.id
       WHERE d.user_id = $1
       ORDER BY a.appointment_date DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get donor appointments error:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

export default router;