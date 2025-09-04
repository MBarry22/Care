const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../database/connection');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().isLength({ min: 2 }),
  body('role').isIn(['senior', 'family', 'caregiver']),
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

    const { email, password, name, role, phone, dateOfBirth } = req.body;

    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate verification token
    const verificationToken = uuidv4();

    // Create user
    const result = await query(`
      INSERT INTO users (email, password_hash, name, role, phone, date_of_birth, verification_token)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, name, role, phone, date_of_birth, is_verified, created_at
    `, [email, passwordHash, name, role, phone, dateOfBirth, verificationToken]);

    const user = result.rows[0];

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    await query(`
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES ($1, $2, $3)
    `, [user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          dateOfBirth: user.date_of_birth,
          isVerified: user.is_verified,
          createdAt: user.created_at
        },
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
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

    const { email, password } = req.body;

    // Find user
    const result = await query(`
      SELECT id, email, password_hash, name, role, phone, date_of_birth, 
             is_verified, last_login, created_at
      FROM users WHERE email = $1
    `, [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    await query(`
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES ($1, $2, $3)
    `, [user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          dateOfBirth: user.date_of_birth,
          isVerified: user.is_verified,
          lastLogin: user.last_login,
          createdAt: user.created_at
        },
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Check if token exists in database
    const tokenResult = await query(`
      SELECT rt.*, u.id, u.email, u.name, u.role, u.phone, u.date_of_birth, 
             u.is_verified, u.last_login, u.created_at
      FROM refresh_tokens rt
      JOIN users u ON rt.user_id = u.id
      WHERE rt.token = $1 AND rt.expires_at > CURRENT_TIMESTAMP
    `, [refreshToken]);

    if (tokenResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    const user = tokenResult.rows[0];

    // Generate new access token
    const newAccessToken = generateAccessToken(user);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Remove refresh token from database
      await query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Forgot password
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
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

    const { email } = req.body;

    // Find user
    const result = await query('SELECT id, name FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      // Don't reveal if email exists
      return res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });
    }

    const user = result.rows[0];

    // Generate reset token
    const resetToken = uuidv4();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token
    await query(`
      UPDATE users 
      SET reset_password_token = $1, reset_password_expires = $2
      WHERE id = $3
    `, [resetToken, resetExpires, user.id]);

    // Send reset email
    try {
      await sendPasswordResetEmail(email, resetToken);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email'
      });
    }

    res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Reset password
router.post('/reset-password', [
  body('token').notEmpty(),
  body('password').isLength({ min: 6 })
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

    const { token, password } = req.body;

    // Find user with valid reset token
    const result = await query(`
      SELECT id FROM users 
      WHERE reset_password_token = $1 AND reset_password_expires > CURRENT_TIMESTAMP
    `, [token]);

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    const user = result.rows[0];

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Update password and clear reset token
    await query(`
      UPDATE users 
      SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL
      WHERE id = $2
    `, [passwordHash, user.id]);

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify email
router.post('/verify-email', [
  body('token').notEmpty()
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

    const { token } = req.body;

    // Find user with verification token
    const result = await query(`
      SELECT id FROM users WHERE verification_token = $1
    `, [token]);

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token'
      });
    }

    const user = result.rows[0];

    // Mark email as verified
    await query(`
      UPDATE users 
      SET is_verified = TRUE, verification_token = NULL
      WHERE id = $1
    `, [user.id]);

    res.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Helper functions
function generateAccessToken(user) {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email 
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
}

module.exports = router;
