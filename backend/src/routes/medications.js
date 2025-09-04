const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { authenticateToken, requireOwnershipOrRole } = require('../middleware/auth');

const router = express.Router();

// Get medications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await query(`
      SELECT id, name, dosage, frequency, times, notes, is_active, created_at, updated_at
      FROM medications
      WHERE user_id = $1
      ORDER BY is_active DESC, name
    `, [userId]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get medications error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add medication
router.post('/', [
  authenticateToken,
  body('name').trim().notEmpty(),
  body('dosage').trim().notEmpty(),
  body('frequency').trim().notEmpty(),
  body('times').isArray({ min: 1 })
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

    const { name, dosage, frequency, times, notes, isActive = true } = req.body;
    const userId = req.user.id;

    const result = await query(`
      INSERT INTO medications (user_id, name, dosage, frequency, times, notes, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, dosage, frequency, times, notes, is_active, created_at, updated_at
    `, [userId, name, dosage, frequency, times, notes, isActive]);

    res.status(201).json({
      success: true,
      message: 'Medication added successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Add medication error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update medication
router.put('/:medicationId', [
  authenticateToken,
  body('name').optional().trim().notEmpty(),
  body('dosage').optional().trim().notEmpty(),
  body('frequency').optional().trim().notEmpty(),
  body('times').optional().isArray({ min: 1 })
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

    const { medicationId } = req.params;
    const { name, dosage, frequency, times, notes, isActive } = req.body;
    const userId = req.user.id;

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (dosage !== undefined) {
      updates.push(`dosage = $${paramCount++}`);
      values.push(dosage);
    }
    if (frequency !== undefined) {
      updates.push(`frequency = $${paramCount++}`);
      values.push(frequency);
    }
    if (times !== undefined) {
      updates.push(`times = $${paramCount++}`);
      values.push(times);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramCount++}`);
      values.push(notes);
    }
    if (isActive !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(isActive);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(medicationId, userId);

    const result = await query(`
      UPDATE medications 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING id, name, dosage, frequency, times, notes, is_active, created_at, updated_at
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    res.json({
      success: true,
      message: 'Medication updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update medication error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete medication
router.delete('/:medicationId', authenticateToken, async (req, res) => {
  try {
    const { medicationId } = req.params;
    const userId = req.user.id;

    const result = await query(`
      DELETE FROM medications 
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `, [medicationId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    res.json({
      success: true,
      message: 'Medication deleted successfully'
    });

  } catch (error) {
    console.error('Delete medication error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
