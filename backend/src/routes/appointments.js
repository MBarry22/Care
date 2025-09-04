const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get appointments
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { date, type } = req.query;
    
    let queryText = `
      SELECT a.id, a.title, a.date, a.time, a.type, a.location, a.notes, 
             a.caregiver_id, u.name as caregiver_name, a.created_at, a.updated_at
      FROM appointments a
      LEFT JOIN users u ON a.caregiver_id = u.id
      WHERE a.user_id = $1
    `;
    const values = [userId];
    let paramCount = 1;

    if (date) {
      queryText += ` AND a.date = $${++paramCount}`;
      values.push(date);
    }

    if (type) {
      queryText += ` AND a.type = $${++paramCount}`;
      values.push(type);
    }

    queryText += ` ORDER BY a.date, a.time`;

    const result = await query(queryText, values);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add appointment
router.post('/', [
  authenticateToken,
  body('title').trim().notEmpty(),
  body('date').isISO8601(),
  body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('type').isIn(['doctor', 'caregiver', 'telehealth', 'other'])
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

    const { title, date, time, type, location, notes, caregiverId } = req.body;
    const userId = req.user.id;

    const result = await query(`
      INSERT INTO appointments (user_id, title, date, time, type, location, notes, caregiver_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, title, date, time, type, location, notes, caregiver_id, created_at, updated_at
    `, [userId, title, date, time, type, location, notes, caregiverId]);

    res.status(201).json({
      success: true,
      message: 'Appointment added successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Add appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update appointment
router.put('/:appointmentId', [
  authenticateToken,
  body('title').optional().trim().notEmpty(),
  body('date').optional().isISO8601(),
  body('time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('type').optional().isIn(['doctor', 'caregiver', 'telehealth', 'other'])
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

    const { appointmentId } = req.params;
    const { title, date, time, type, location, notes, caregiverId } = req.body;
    const userId = req.user.id;

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (date !== undefined) {
      updates.push(`date = $${paramCount++}`);
      values.push(date);
    }
    if (time !== undefined) {
      updates.push(`time = $${paramCount++}`);
      values.push(time);
    }
    if (type !== undefined) {
      updates.push(`type = $${paramCount++}`);
      values.push(type);
    }
    if (location !== undefined) {
      updates.push(`location = $${paramCount++}`);
      values.push(location);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramCount++}`);
      values.push(notes);
    }
    if (caregiverId !== undefined) {
      updates.push(`caregiver_id = $${paramCount++}`);
      values.push(caregiverId);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(appointmentId, userId);

    const result = await query(`
      UPDATE appointments 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING id, title, date, time, type, location, notes, caregiver_id, created_at, updated_at
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete appointment
router.delete('/:appointmentId', authenticateToken, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.id;

    const result = await query(`
      DELETE FROM appointments 
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `, [appointmentId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      message: 'Appointment deleted successfully'
    });

  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
