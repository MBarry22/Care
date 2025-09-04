const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get messages
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { recipientId, limit = 50, offset = 0 } = req.query;
    
    let queryText = `
      SELECT m.id, m.sender_id, m.recipient_id, m.content, m.is_read, m.created_at,
             sender.name as sender_name, recipient.name as recipient_name
      FROM messages m
      JOIN users sender ON m.sender_id = sender.id
      JOIN users recipient ON m.recipient_id = recipient.id
      WHERE (m.sender_id = $1 OR m.recipient_id = $1)
    `;
    const values = [userId];
    let paramCount = 1;

    if (recipientId) {
      queryText += ` AND ((m.sender_id = $${++paramCount} AND m.recipient_id = $1) OR (m.sender_id = $1 AND m.recipient_id = $${paramCount}))`;
      values.push(recipientId);
    }

    queryText += ` ORDER BY m.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    values.push(parseInt(limit), parseInt(offset));

    const result = await query(queryText, values);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Send message
router.post('/', [
  authenticateToken,
  body('recipientId').isUUID(),
  body('content').trim().isLength({ min: 1, max: 1000 })
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

    const { recipientId, content } = req.body;
    const senderId = req.user.id;

    // Check if recipient exists
    const recipientResult = await query(`
      SELECT id, name FROM users WHERE id = $1
    `, [recipientId]);

    if (recipientResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    const result = await query(`
      INSERT INTO messages (sender_id, recipient_id, content)
      VALUES ($1, $2, $3)
      RETURNING id, sender_id, recipient_id, content, is_read, created_at
    `, [senderId, recipientId, content]);

    const message = result.rows[0];
    const recipient = recipientResult.rows[0];

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        ...message,
        recipientName: recipient.name
      }
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Mark message as read
router.put('/:messageId/read', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const result = await query(`
      UPDATE messages 
      SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND recipient_id = $2
      RETURNING id
    `, [messageId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.json({
      success: true,
      message: 'Message marked as read'
    });

  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Mark all messages as read
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { senderId } = req.body;

    let queryText = `
      UPDATE messages 
      SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE recipient_id = $1
    `;
    const values = [userId];
    let paramCount = 1;

    if (senderId) {
      queryText += ` AND sender_id = $${++paramCount}`;
      values.push(senderId);
    }

    queryText += ` RETURNING id`;

    const result = await query(queryText, values);

    res.json({
      success: true,
      message: `${result.rows.length} messages marked as read`
    });

  } catch (error) {
    console.error('Mark all messages as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get unread message count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(`
      SELECT COUNT(*) as unread_count
      FROM messages
      WHERE recipient_id = $1 AND is_read = FALSE
    `, [userId]);

    res.json({
      success: true,
      data: {
        unreadCount: parseInt(result.rows[0].unread_count)
      }
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get conversation list
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(`
      SELECT DISTINCT
        CASE 
          WHEN m.sender_id = $1 THEN m.recipient_id
          ELSE m.sender_id
        END as contact_id,
        CASE 
          WHEN m.sender_id = $1 THEN recipient.name
          ELSE sender.name
        END as contact_name,
        CASE 
          WHEN m.sender_id = $1 THEN recipient.role
          ELSE sender.role
        END as contact_role,
        MAX(m.created_at) as last_message_time,
        COUNT(CASE WHEN m.recipient_id = $1 AND m.is_read = FALSE THEN 1 END) as unread_count
      FROM messages m
      JOIN users sender ON m.sender_id = sender.id
      JOIN users recipient ON m.recipient_id = recipient.id
      WHERE m.sender_id = $1 OR m.recipient_id = $1
      GROUP BY contact_id, contact_name, contact_role
      ORDER BY last_message_time DESC
    `, [userId]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
