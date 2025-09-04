const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get health entries
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { date, limit = 30 } = req.query;
    
    let queryText = `
      SELECT id, date, blood_pressure, heart_rate, weight, mood, notes, created_at, updated_at
      FROM health_entries
      WHERE user_id = $1
    `;
    const values = [userId];
    let paramCount = 1;

    if (date) {
      queryText += ` AND date = $${++paramCount}`;
      values.push(date);
    }

    queryText += ` ORDER BY date DESC LIMIT $${++paramCount}`;
    values.push(parseInt(limit));

    const result = await query(queryText, values);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get health entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add health entry
router.post('/', [
  authenticateToken,
  body('date').isISO8601(),
  body('mood').isIn(['excellent', 'good', 'fair', 'poor']),
  body('bloodPressure').optional().matches(/^\d{2,3}\/\d{2,3}$/),
  body('heartRate').optional().isInt({ min: 30, max: 200 }),
  body('weight').optional().isFloat({ min: 50, max: 500 })
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

    const { date, bloodPressure, heartRate, weight, mood, notes } = req.body;
    const userId = req.user.id;

    // Check if entry already exists for this date
    const existingResult = await query(`
      SELECT id FROM health_entries WHERE user_id = $1 AND date = $2
    `, [userId, date]);

    if (existingResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Health entry already exists for this date'
      });
    }

    const result = await query(`
      INSERT INTO health_entries (user_id, date, blood_pressure, heart_rate, weight, mood, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, date, blood_pressure, heart_rate, weight, mood, notes, created_at, updated_at
    `, [userId, date, bloodPressure, heartRate, weight, mood, notes]);

    res.status(201).json({
      success: true,
      message: 'Health entry added successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Add health entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update health entry
router.put('/:entryId', [
  authenticateToken,
  body('mood').optional().isIn(['excellent', 'good', 'fair', 'poor']),
  body('bloodPressure').optional().matches(/^\d{2,3}\/\d{2,3}$/),
  body('heartRate').optional().isInt({ min: 30, max: 200 }),
  body('weight').optional().isFloat({ min: 50, max: 500 })
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

    const { entryId } = req.params;
    const { bloodPressure, heartRate, weight, mood, notes } = req.body;
    const userId = req.user.id;

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (bloodPressure !== undefined) {
      updates.push(`blood_pressure = $${paramCount++}`);
      values.push(bloodPressure);
    }
    if (heartRate !== undefined) {
      updates.push(`heart_rate = $${paramCount++}`);
      values.push(heartRate);
    }
    if (weight !== undefined) {
      updates.push(`weight = $${paramCount++}`);
      values.push(weight);
    }
    if (mood !== undefined) {
      updates.push(`mood = $${paramCount++}`);
      values.push(mood);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramCount++}`);
      values.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(entryId, userId);

    const result = await query(`
      UPDATE health_entries 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING id, date, blood_pressure, heart_rate, weight, mood, notes, created_at, updated_at
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Health entry not found'
      });
    }

    res.json({
      success: true,
      message: 'Health entry updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update health entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete health entry
router.delete('/:entryId', authenticateToken, async (req, res) => {
  try {
    const { entryId } = req.params;
    const userId = req.user.id;

    const result = await query(`
      DELETE FROM health_entries 
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `, [entryId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Health entry not found'
      });
    }

    res.json({
      success: true,
      message: 'Health entry deleted successfully'
    });

  } catch (error) {
    console.error('Delete health entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get health trends
router.get('/trends', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;

    const result = await query(`
      SELECT 
        AVG(heart_rate) as avg_heart_rate,
        AVG(weight) as avg_weight,
        COUNT(*) as total_entries,
        MIN(date) as start_date,
        MAX(date) as end_date
      FROM health_entries
      WHERE user_id = $1 
        AND date >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
        AND (heart_rate IS NOT NULL OR weight IS NOT NULL)
    `, [userId]);

    const trends = result.rows[0];

    res.json({
      success: true,
      data: {
        averageHeartRate: trends.avg_heart_rate ? Math.round(trends.avg_heart_rate) : null,
        averageWeight: trends.avg_weight ? Math.round(trends.avg_weight * 10) / 10 : null,
        totalEntries: parseInt(trends.total_entries),
        period: {
          startDate: trends.start_date,
          endDate: trends.end_date,
          days: parseInt(days)
        }
      }
    });

  } catch (error) {
    console.error('Get health trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
