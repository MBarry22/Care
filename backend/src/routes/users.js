const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { authenticateToken, requireOwnershipOrRole } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        dateOfBirth: user.date_of_birth,
        isVerified: user.is_verified,
        lastLogin: user.last_login,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update user profile
router.put('/profile', [
  authenticateToken,
  body('name').optional().trim().isLength({ min: 2 }),
  body('phone').optional().isMobilePhone(),
  body('dateOfBirth').optional().isISO8601()
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

    const { name, phone, dateOfBirth } = req.body;
    const userId = req.user.id;

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(phone);
    }
    if (dateOfBirth !== undefined) {
      updates.push(`date_of_birth = $${paramCount++}`);
      values.push(dateOfBirth);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(userId);

    const result = await query(`
      UPDATE users 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING id, email, name, role, phone, date_of_birth, is_verified, created_at
    `, values);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get family members
router.get('/family', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let result;
    
    if (userRole === 'senior') {
      // Get family members for this senior
      result = await query(`
        SELECT u.id, u.email, u.name, u.role, u.phone, u.is_verified,
               fr.relationship, fr.is_primary_contact
        FROM family_relationships fr
        JOIN users u ON fr.family_member_id = u.id
        WHERE fr.senior_id = $1
        ORDER BY fr.is_primary_contact DESC, u.name
      `, [userId]);
    } else if (userRole === 'family') {
      // Get the senior this family member is connected to
      result = await query(`
        SELECT u.id, u.email, u.name, u.role, u.phone, u.is_verified,
               fr.relationship, fr.is_primary_contact
        FROM family_relationships fr
        JOIN users u ON fr.senior_id = u.id
        WHERE fr.family_member_id = $1
        ORDER BY u.name
      `, [userId]);
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get family error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add family member
router.post('/family', [
  authenticateToken,
  body('email').isEmail().normalizeEmail(),
  body('relationship').trim().notEmpty()
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

    const { email, relationship, isPrimaryContact = false } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'senior') {
      return res.status(403).json({
        success: false,
        message: 'Only seniors can add family members'
      });
    }

    // Find the family member by email
    const familyMemberResult = await query(`
      SELECT id, name, role FROM users WHERE email = $1 AND role = 'family'
    `, [email]);

    if (familyMemberResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Family member not found. They must register first.'
      });
    }

    const familyMember = familyMemberResult.rows[0];

    // Check if relationship already exists
    const existingResult = await query(`
      SELECT id FROM family_relationships 
      WHERE senior_id = $1 AND family_member_id = $2
    `, [userId, familyMember.id]);

    if (existingResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Family member already added'
      });
    }

    // Add family relationship
    await query(`
      INSERT INTO family_relationships (senior_id, family_member_id, relationship, is_primary_contact)
      VALUES ($1, $2, $3, $4)
    `, [userId, familyMember.id, relationship, isPrimaryContact]);

    res.status(201).json({
      success: true,
      message: 'Family member added successfully',
      data: {
        id: familyMember.id,
        name: familyMember.name,
        email: email,
        relationship: relationship,
        isPrimaryContact: isPrimaryContact
      }
    });

  } catch (error) {
    console.error('Add family member error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Remove family member
router.delete('/family/:familyMemberId', authenticateToken, async (req, res) => {
  try {
    const { familyMemberId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'senior') {
      return res.status(403).json({
        success: false,
        message: 'Only seniors can remove family members'
      });
    }

    const result = await query(`
      DELETE FROM family_relationships 
      WHERE senior_id = $1 AND family_member_id = $2
      RETURNING id
    `, [userId, familyMemberId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Family member not found'
      });
    }

    res.json({
      success: true,
      message: 'Family member removed successfully'
    });

  } catch (error) {
    console.error('Remove family member error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get emergency contacts
router.get('/emergency-contacts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(`
      SELECT id, name, phone, relationship, is_primary
      FROM emergency_contacts
      WHERE user_id = $1
      ORDER BY is_primary DESC, name
    `, [userId]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get emergency contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add emergency contact
router.post('/emergency-contacts', [
  authenticateToken,
  body('name').trim().notEmpty(),
  body('phone').isMobilePhone(),
  body('relationship').trim().notEmpty()
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

    const { name, phone, relationship, isPrimary = false } = req.body;
    const userId = req.user.id;

    // If setting as primary, unset other primary contacts
    if (isPrimary) {
      await query(`
        UPDATE emergency_contacts 
        SET is_primary = FALSE 
        WHERE user_id = $1
      `, [userId]);
    }

    const result = await query(`
      INSERT INTO emergency_contacts (user_id, name, phone, relationship, is_primary)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, phone, relationship, is_primary
    `, [userId, name, phone, relationship, isPrimary]);

    res.status(201).json({
      success: true,
      message: 'Emergency contact added successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Add emergency contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update emergency contact
router.put('/emergency-contacts/:contactId', [
  authenticateToken,
  body('name').optional().trim().notEmpty(),
  body('phone').optional().isMobilePhone(),
  body('relationship').optional().trim().notEmpty()
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

    const { contactId } = req.params;
    const { name, phone, relationship, isPrimary } = req.body;
    const userId = req.user.id;

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(phone);
    }
    if (relationship !== undefined) {
      updates.push(`relationship = $${paramCount++}`);
      values.push(relationship);
    }
    if (isPrimary !== undefined) {
      updates.push(`is_primary = $${paramCount++}`);
      values.push(isPrimary);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(contactId, userId);

    const result = await query(`
      UPDATE emergency_contacts 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING id, name, phone, relationship, is_primary
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Emergency contact not found'
      });
    }

    res.json({
      success: true,
      message: 'Emergency contact updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update emergency contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete emergency contact
router.delete('/emergency-contacts/:contactId', authenticateToken, async (req, res) => {
  try {
    const { contactId } = req.params;
    const userId = req.user.id;

    const result = await query(`
      DELETE FROM emergency_contacts 
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `, [contactId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Emergency contact not found'
      });
    }

    res.json({
      success: true,
      message: 'Emergency contact deleted successfully'
    });

  } catch (error) {
    console.error('Delete emergency contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
