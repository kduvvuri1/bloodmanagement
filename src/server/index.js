// src/server/index.js
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

console.log('🔄 Starting server...');

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
});

// Simple auth middleware - MUST BE DEFINED BEFORE ROUTES THAT USE IT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // For simple token format: 'jwt-token-{userId}'
    if (token.startsWith('jwt-token-')) {
      const userId = token.replace('jwt-token-', '');
      req.user = { userId: parseInt(userId) };
      return next();
    }

    // For proper JWT tokens
    const user = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ 
      status: 'OK', 
      message: 'Server and database are running',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'ERROR', 
      message: 'Server running but database connection failed',
      error: error.message
    });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Auth routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    console.log('Signup attempt:', { email, role });

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create user - using password_hash column for better security
    const userResult = await pool.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, profile_completed',
      [email, password, role] // For now, store plain text. You should hash this later!
    );

    const user = userResult.rows[0];

    // Create donor profile if role is donor
    if (role === 'donor') {
      await pool.query(
        'INSERT INTO donors (user_id) VALUES ($1)',
        [user.id]
      );
    } else if (role === 'hospital') {
      await pool.query(
        'INSERT INTO hospitals (user_id, name) VALUES ($1, $2)',
        [user.id, 'New Hospital Center']
      );
    }

    const userResponse = {
      id: user.id,
      email: user.email,
      role: user.role,
      profileCompleted: user.profile_completed
    };

    console.log('Signup successful:', userResponse);

    res.status(201).json({
      token: 'jwt-token-' + user.id,
      user: userResponse
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Registration failed: ' + error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    console.log('Login attempt:', { email, role });
    
    // Try both password and password_hash columns
    const result = await pool.query(
      'SELECT id, email, role, profile_completed, password, password_hash FROM users WHERE email = $1 AND role = $2',
      [email, role]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    
    // Check password (try both column names)
    const userPassword = user.password || user.password_hash;
    if (password !== userPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userResponse = {
      id: user.id,
      email: user.email,
      role: user.role,
      profileCompleted: user.profile_completed
    };

    console.log('Login successful:', userResponse);

    res.json({ 
      token: 'jwt-token-' + user.id,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed: ' + error.message });
  }
});

// Nearby donors endpoint - NOW THIS CAN USE authenticateToken SINCE IT'S DEFINED ABOVE
app.get('/api/hospitals/nearby-donors', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bloodType, maxDistance = 5 } = req.query;

    // Get hospital with coordinates
    const hospitalResult = await pool.query(
      `SELECT id, name, latitude, longitude 
       FROM hospitals 
       WHERE user_id = $1 AND latitude IS NOT NULL AND longitude IS NOT NULL`,
      [userId]
    );

    if (hospitalResult.rows.length === 0) {
      return res.status(400).json({ 
        error: "Hospital location not set. Please update your address in profile." 
      });
    }

    const hospital = hospitalResult.rows[0];

    // Build donor query
    let query = `
      SELECT 
        id, first_name, last_name, blood_type,
        latitude, longitude, eligibility_status
      FROM donors 
      WHERE latitude IS NOT NULL 
        AND longitude IS NOT NULL
        AND eligibility_status = 'eligible'
    `;
    const params = [];

    if (bloodType && bloodType !== 'all') {
      query += ` AND blood_type = $${params.length + 1}`;
      params.push(bloodType);
    }

    const donorsResult = await pool.query(query, params);

    // Haversine formula: accurate distance in miles
    const haversine = (lat1, lon1, lat2, lon2) => {
      const toRad = (x) => x * Math.PI / 180;
      const R = 3958.8; // Earth radius in miles

      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    const nearbyDonors = donorsResult.rows
      .map(donor => {
        const distance = haversine(
          hospital.latitude,
          hospital.longitude,
          donor.latitude,
          donor.longitude
        );
        return { ...donor, distance };
      })
      .filter(d => d.distance <= maxDistance)
      .map(({ distance, ...donor }) => ({
        ...donor,
        distance: Math.round(distance * 10) / 10
      }))
      .sort((a, b) => a.distance - b.distance);

    res.json({
      hospital: {
        id: hospital.id,
        name: hospital.name,
        latitude: hospital.latitude,
        longitude: hospital.longitude
      },
      donors: nearbyDonors,
      totalCount: nearbyDonors.length,
      bloodType: bloodType || 'all',
      maxDistance: parseInt(maxDistance)
    });

  } catch (error) {
    console.error('Nearby donors error:', error);
    res.status(500).json({ error: 'Failed to load nearby donors' });
  }
});

// Update donor coordinates
app.post('/api/donors/:id/coordinates', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;

    const result = await pool.query(
      `UPDATE donors 
       SET latitude = $1, longitude = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, first_name, last_name, latitude, longitude`,
      [latitude, longitude, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    res.json({
      success: true,
      message: 'Coordinates updated successfully',
      donor: result.rows[0]
    });
  } catch (error) {
    console.error('Update donor coordinates error:', error);
    res.status(500).json({ error: 'Failed to update coordinates' });
  }
});

// Update hospital coordinates
app.post('/api/hospitals/:id/coordinates', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;

    const result = await pool.query(
      `UPDATE hospitals 
       SET latitude = $1, longitude = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, name, latitude, longitude`,
      [latitude, longitude, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    res.json({
      success: true,
      message: 'Coordinates updated successfully',
      hospital: result.rows[0]
    });
  } catch (error) {
    console.error('Update hospital coordinates error:', error);
    res.status(500).json({ error: 'Failed to update coordinates' });
  }
});



// Donor profile routes
app.get('/api/donors/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    console.log('Fetching profile for user ID:', userId);

    const result = await pool.query(
      `SELECT * FROM donors WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Donor profile not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

app.post('/api/donors/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phoneNumber,
      street,
      city,
      state,
      zipCode,
      bloodType,
      weight,
      height,
      hasChronicIllness,
      chronicIllnessDetails,
      hasTraveled,
      travelDetails,
      hasTattoo,
      tattooDetails,
      isOnMedication,
      medicationDetails,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelationship
    } = req.body;

    console.log('Updating donor profile for user:', userId);

    // Convert boolean strings to actual booleans for PostgreSQL
    const hasChronicIllnessBool = hasChronicIllness === 'yes';
    const hasTraveledBool = hasTraveled === 'yes';
    const hasTattooBool = hasTattoo === 'yes';
    const isOnMedicationBool = isOnMedication === 'yes';

    const result = await pool.query(
      `INSERT INTO donors (
        user_id, first_name, last_name, date_of_birth, gender, phone_number,
        street, city, state, zip_code, blood_type, weight, height,
        has_chronic_illness, chronic_illness_details, has_traveled, travel_details,
        has_tattoo, tattoo_details, is_on_medication, medication_details,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relationship
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      ON CONFLICT (user_id) 
      DO UPDATE SET
        first_name = $2, last_name = $3, date_of_birth = $4, gender = $5, phone_number = $6,
        street = $7, city = $8, state = $9, zip_code = $10, blood_type = $11, weight = $12, height = $13,
        has_chronic_illness = $14, chronic_illness_details = $15, has_traveled = $16, travel_details = $17,
        has_tattoo = $18, tattoo_details = $19, is_on_medication = $20, medication_details = $21,
        emergency_contact_name = $22, emergency_contact_phone = $23, emergency_contact_relationship = $24,
        updated_at = NOW()
      RETURNING *`,
      [
        userId, firstName, lastName, dateOfBirth, gender, phoneNumber,
        street, city, state, zipCode, bloodType, Number(weight), Number(height),
        hasChronicIllnessBool, chronicIllnessDetails, hasTraveledBool, travelDetails,
        hasTattooBool, tattooDetails, isOnMedicationBool, medicationDetails,
        emergencyContactName, emergencyContactPhone, emergencyContactRelationship
      ]
    );

    // Mark user profile as completed
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
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile: ' + error.message });
  }
});

// Hospital profile routes
app.get('/api/hospitals/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT * FROM hospitals WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Hospital profile not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get hospital profile error:', error);
    res.status(500).json({ error: 'Failed to get hospital profile' });
  }
});

app.post('/api/hospitals/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      name,
      address,
      city,
      state,
      zipCode,
      phoneNumber,
      email,
      latitude,
      longitude,
      operatingHours
    } = req.body;

    const result = await pool.query(
      `INSERT INTO hospitals (
        user_id, name, address, city, state, zip_code, phone_number,
        email, latitude, longitude, operating_hours
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (user_id) 
      DO UPDATE SET
        name = $2, address = $3, city = $4, state = $5, zip_code = $6,
        phone_number = $7, email = $8, latitude = $9, longitude = $10,
        operating_hours = $11, updated_at = NOW()
      RETURNING *`,
      [
        userId, name, address, city, state, zipCode, phoneNumber,
        email, latitude, longitude, operatingHours
      ]
    );

    // Mark user profile as completed
    await pool.query(
      'UPDATE users SET profile_completed = true WHERE id = $1',
      [userId]
    );

    res.json({ 
      success: true, 
      message: 'Hospital profile updated successfully',
      hospital: result.rows[0]
    });
  } catch (error) {
    console.error('Update hospital profile error:', error);
    res.status(500).json({ error: 'Failed to update hospital profile: ' + error.message });
  }
});

// Hospital urgency level
app.put('/api/hospitals/urgency', authenticateToken, async (req, res) => {
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

// Get all hospitals for map
app.get('/api/hospitals/map', async (req, res) => {
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

// Patient routes
app.get('/api/patients', authenticateToken, async (req, res) => {
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

app.post('/api/patients', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      patientName,
      bloodType,
      condition,
      urgencyLevel,
      unitsRequired,
      requiredDate,
      notes
    } = req.body;

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
        patientName,
        bloodType,
        condition,
        urgencyLevel,
        unitsRequired,
        requiredDate,
        notes
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

app.put('/api/patients/:id/status', authenticateToken, async (req, res) => {
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

// Appointment routes
app.get('/api/appointments/donor', authenticateToken, async (req, res) => {
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

app.post('/api/appointments', authenticateToken, async (req, res) => {
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

// Hospital inventory routes
app.get('/api/hospitals/inventory', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get hospital ID from user ID
    const hospitalResult = await pool.query(
      'SELECT id FROM hospitals WHERE user_id = $1',
      [userId]
    );

    if (hospitalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    const hospitalId = hospitalResult.rows[0].id;

    // Get real inventory from blood_inventory table
    const inventoryResult = await pool.query(
      'SELECT blood_type, quantity FROM blood_inventory WHERE hospital_id = $1',
      [hospitalId]
    );

    // Convert array format to object format for frontend compatibility
    const inventory = {};
    inventoryResult.rows.forEach(item => {
      // Convert blood_type from "A+" to "A_plus" format for frontend
      const frontendKey = item.blood_type.replace('+', '_plus').replace('-', '_negative');
      inventory[frontendKey] = item.quantity;
    });

    res.json(inventory);
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

app.post('/api/hospitals/inventory', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const inventoryData = req.body;

    // Get hospital ID from user ID
    const hospitalResult = await pool.query(
      'SELECT id FROM hospitals WHERE user_id = $1',
      [userId]
    );

    if (hospitalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    const hospitalId = hospitalResult.rows[0].id;

    // Update each blood type in the inventory
    const updates = Object.entries(inventoryData).map(async ([bloodType, quantity]) => {
      // Convert frontend key "A_plus" back to database format "A+"
      const dbBloodType = bloodType.replace('_plus', '+').replace('_negative', '-');
      
      await pool.query(
        `INSERT INTO blood_inventory (hospital_id, blood_type, quantity) 
         VALUES ($1, $2, $3)
         ON CONFLICT (hospital_id, blood_type) 
         DO UPDATE SET quantity = $3, updated_at = NOW()`,
        [hospitalId, dbBloodType, quantity]
      );
    });

    await Promise.all(updates);

    // Return updated inventory
    const updatedInventoryResult = await pool.query(
      'SELECT blood_type, quantity FROM blood_inventory WHERE hospital_id = $1',
      [hospitalId]
    );

    const updatedInventory = {};
    updatedInventoryResult.rows.forEach(item => {
      const frontendKey = item.blood_type.replace('+', '_plus').replace('-', '_negative');
      updatedInventory[frontendKey] = item.quantity;
    });

    res.json(updatedInventory);
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ error: 'Failed to update inventory' });
  }
});

// Debug endpoints
app.get('/api/debug/users', async (req, res) => {
  try {
    const usersResult = await pool.query('SELECT * FROM users');
    const donorsResult = await pool.query('SELECT * FROM donors');
    const hospitalsResult = await pool.query('SELECT * FROM hospitals');
    const patientsResult = await pool.query('SELECT * FROM patients');
    
    res.json({
      users: usersResult.rows,
      donors: donorsResult.rows,
      hospitals: hospitalsResult.rows,
      patients: patientsResult.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reset', async (req, res) => {
  try {
    await pool.query('DELETE FROM patients');
    await pool.query('DELETE FROM appointments');
    await pool.query('DELETE FROM donors');
    await pool.query('DELETE FROM hospitals');
    await pool.query('DELETE FROM users');
    res.json({ message: 'Database reset successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const geocodeCache = new Map();

// Geocoding function for addresses
const geocodeAddress = async (address) => {
  if (geocodeCache.has(address)) {
    return geocodeCache.get(address);
  }

  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('No Google Maps API key - using fallback');
      return { latitude: 33.7490, longitude: -84.3880 };
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: { address, key: apiKey },
      timeout: 5000
    });

    if (response.data.status === 'OK' && response.data.results[0]) {
      const loc = response.data.results[0].geometry.location;
      const result = { latitude: loc.lat, longitude: loc.lng };
      geocodeCache.set(address, result);
      return result;
    } else {
      console.warn(`Geocoding failed for: ${address}`, response.data.status);
      return null;
    }
  } catch (err) {
    console.error('Geocoding error:', err.message);
    return null;
  }
};

// Geocode existing records (one-time migration)
app.post('/api/admin/geocode-existing', async (req, res) => {
  try {
    console.log('Geocoding existing records with missing coordinates...');

    // Geocode hospitals with missing coordinates
    const hospitalsMissingCoords = await pool.query(
      `SELECT id, name, address, city, state, zip_code 
       FROM hospitals 
       WHERE latitude IS NULL OR longitude IS NULL`
    );

    for (const hospital of hospitalsMissingCoords.rows) {
      const fullAddress = `${hospital.address}, ${hospital.city}, ${hospital.state} ${hospital.zip_code}`;
      const coordinates = await geocodeAddress(fullAddress);
      
      await pool.query(
        'UPDATE hospitals SET latitude = $1, longitude = $2 WHERE id = $3',
        [coordinates.latitude, coordinates.longitude, hospital.id]
      );
      
      console.log(`Geocoded hospital: ${hospital.name} -> ${coordinates.latitude}, ${coordinates.longitude}`);
    }

    // Geocode donors with missing coordinates
    const donorsMissingCoords = await pool.query(
      `SELECT id, first_name, last_name, street, city, state, zip_code 
       FROM donors 
       WHERE latitude IS NULL OR longitude IS NULL`
    );

    for (const donor of donorsMissingCoords.rows) {
      const fullAddress = `${donor.street}, ${donor.city}, ${donor.state} ${donor.zip_code}`;
      const coordinates = await geocodeAddress(fullAddress);
      
      await pool.query(
        'UPDATE donors SET latitude = $1, longitude = $2 WHERE id = $3',
        [coordinates.latitude, coordinates.longitude, donor.id]
      );
      
      console.log(`Geocoded donor: ${donor.first_name} ${donor.last_name} -> ${coordinates.latitude}, ${coordinates.longitude}`);
    }

    res.json({
      success: true,
      message: `Geocoded ${hospitalsMissingCoords.rows.length} hospitals and ${donorsMissingCoords.rows.length} donors`
    });

  } catch (error) {
    console.error('Geocoding migration error:', error);
    res.status(500).json({ error: 'Migration failed: ' + error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📍 Nearby donors: http://localhost:${PORT}/api/hospitals/nearby-donors?bloodType=O+`);
  console.log(`🗺️  Geocode migration: http://localhost:${PORT}/api/admin/geocode-existing`);
  console.log(`🐛 Debug: http://localhost:${PORT}/api/debug/users`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use!`);
  } else {
    console.error('❌ Server failed to start:', err);
  }
  process.exit(1);
});
