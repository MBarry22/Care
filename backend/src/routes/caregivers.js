const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get available caregivers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { specialty, available = true } = req.query;
    
    let queryText = `
      SELECT c.id, c.specialty, c.rating, c.total_ratings, c.is_available, 
             c.hourly_rate, c.bio, c.certifications,
             u.id as user_id, u.name, u.phone, u.email
      FROM caregivers c
      JOIN users u ON c.user_id = u.id
      WHERE c.is_available = $1
    `;
    const values = [available === 'true'];
    let paramCount = 1;

    if (specialty) {
      queryText += ` AND c.specialty ILIKE $${++paramCount}`;
      values.push(`%${specialty}%`);
    }

    queryText += ` ORDER BY c.rating DESC, c.total_ratings DESC`;

    const result = await query(queryText, values);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get caregivers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get caregiver profile
router.get('/:caregiverId', authenticateToken, async (req, res) => {
  try {
    const { caregiverId } = req.params;

    const result = await query(`
      SELECT c.id, c.specialty, c.rating, c.total_ratings, c.is_available, 
             c.hourly_rate, c.bio, c.certifications, c.created_at,
             u.id as user_id, u.name, u.phone, u.email
      FROM caregivers c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `, [caregiverId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Caregiver not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get caregiver profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create caregiver profile (for caregivers only)
router.post('/', [
  authenticateToken,
  requireRole('caregiver'),
  body('specialty').trim().notEmpty(),
  body('bio').optional().trim(),
  body('hourlyRate').optional().isFloat({ min: 0 }),
  body('certifications').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { specialty, bio, hourlyRate, certifications = [] } = req.body;
    const userId = req.user.id;

    // Check if caregiver profile already exists
    const existingResult = await query(`
      SELECT id FROM caregivers WHERE user_id = $1
    `, [userId]);

    if (existingResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Caregiver profile already exists'
      });
    }

    const result = await query(`
      INSERT INTO caregivers (user_id, specialty, bio, hourly_rate, certifications)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, specialty, bio, hourly_rate, certifications, rating, total_ratings, is_available, created_at
    `, [userId, specialty, bio, hourlyRate, certifications]);

    res.status(201).json({
      success: true,
      message: 'Caregiver profile created successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Create caregiver profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update caregiver profile
router.put('/:caregiverId', [
  authenticateToken,
  requireRole('caregiver'),
  body('specialty').optional().trim().notEmpty(),
  body('bio').optional().trim(),
  body('hourlyRate').optional().isFloat({ min: 0 }),
  body('certifications').optional().isArray(),
  body('isAvailable').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { caregiverId } = req.params;
    const { specialty, bio, hourlyRate, certifications, isAvailable } = req.body;
    const userId = req.user.id;

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (specialty !== undefined) {
      updates.push(`specialty = $${paramCount++}`);
      values.push(specialty);
    }
    if (bio !== undefined) {
      updates.push(`bio = $${paramCount++}`);
      values.push(bio);
    }
    if (hourlyRate !== undefined) {
      updates.push(`hourly_rate = $${paramCount++}`);
      values.push(hourlyRate);
    }
    if (certifications !== undefined) {
      updates.push(`certifications = $${paramCount++}`);
      values.push(certifications);
    }
    if (isAvailable !== undefined) {
      updates.push(`is_available = $${paramCount++}`);
      values.push(isAvailable);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(caregiverId, userId);

    const result = await query(`
      UPDATE caregivers 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING id, specialty, bio, hourly_rate, certifications, rating, total_ratings, is_available, created_at, updated_at
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Caregiver profile not found'
      });
    }

    res.json({
      success: true,
      message: 'Caregiver profile updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update caregiver profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get caregiver assignments
router.get('/assignments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let queryText;
    let values;

    if (userRole === 'caregiver') {
      // Get assignments for this caregiver
      queryText = `
        SELECT ca.id, ca.start_date, ca.end_date, ca.status, ca.notes, ca.created_at,
               u.id as senior_id, u.name as senior_name, u.phone as senior_phone
        FROM caregiver_assignments ca
        JOIN users u ON ca.senior_id = u.id
        WHERE ca.caregiver_id = $1
        ORDER BY ca.start_date DESC
      `;
      values = [userId];
    } else if (userRole === 'senior') {
      // Get assignments for this senior
      queryText = `
        SELECT ca.id, ca.start_date, ca.end_date, ca.status, ca.notes, ca.created_at,
               u.id as caregiver_id, u.name as caregiver_name, u.phone as caregiver_phone,
               c.specialty, c.rating
        FROM caregiver_assignments ca
        JOIN users u ON ca.caregiver_id = u.id
        LEFT JOIN caregivers c ON ca.caregiver_id = c.user_id
        WHERE ca.senior_id = $1
        ORDER BY ca.start_date DESC
      `;
      values = [userId];
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const result = await query(queryText, values);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get caregiver assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create caregiver assignment
router.post('/assignments', [
  authenticateToken,
  requireRole(['senior', 'family']),
  body('caregiverId').isUUID(),
  body('startDate').isISO8601(),
  body('endDate').optional().isISO8601(),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { caregiverId, startDate, endDate, notes } = req.body;
    const seniorId = req.user.role === 'senior' ? req.user.id : req.body.seniorId;

    if (!seniorId) {
      return res.status(400).json({
        success: false,
        message: 'Senior ID required for family members'
      });
    }

    // Verify caregiver exists and is available
    const caregiverResult = await query(`
      SELECT c.id, c.is_available, u.name
      FROM caregivers c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `, [caregiverId]);

    if (caregiverResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Caregiver not found'
      });
    }

    const caregiver = caregiverResult.rows[0];
    if (!caregiver.is_available) {
      return res.status(400).json({
        success: false,
        message: 'Caregiver is not available'
      });
    }

    const result = await query(`
      INSERT INTO caregiver_assignments (senior_id, caregiver_id, start_date, end_date, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, senior_id, caregiver_id, start_date, end_date, status, notes, created_at
    `, [seniorId, caregiverId, startDate, endDate, notes]);

    res.status(201).json({
      success: true,
      message: 'Caregiver assignment created successfully',
      data: {
        ...result.rows[0],
        caregiverName: caregiver.name
      }
    });

  } catch (error) {
    console.error('Create caregiver assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
