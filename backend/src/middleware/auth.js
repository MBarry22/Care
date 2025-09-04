const jwt = require('jsonwebtoken');
const { query } = require('../database/connection');

// Authenticate JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const result = await query(`
      SELECT id, email, name, role, phone, date_of_birth, is_verified, 
             last_login, created_at
      FROM users WHERE id = $1
    `, [decoded.userId]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add user to request object
    req.user = result.rows[0];
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Check if user has specific role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Check if user can access resource (owner or admin)
const requireOwnershipOrRole = (roles = []) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const userId = req.params.userId || req.body.userId;
      const userRole = req.user.role;
      const allowedRoles = Array.isArray(roles) ? roles : [roles];

      // Allow if user is accessing their own resource
      if (userId && req.user.id === userId) {
        return next();
      }

      // Allow if user has required role
      if (allowedRoles.includes(userRole)) {
        return next();
      }

      // For family members, check if they're related to the senior
      if (userRole === 'family' && userId) {
        const relationshipResult = await query(`
          SELECT id FROM family_relationships 
          WHERE family_member_id = $1 AND senior_id = $2
        `, [req.user.id, userId]);

        if (relationshipResult.rows.length > 0) {
          return next();
        }
      }

      res.status(403).json({
        success: false,
        message: 'Access denied'
      });

    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const result = await query(`
        SELECT id, email, name, role, phone, date_of_birth, is_verified, 
               last_login, created_at
        FROM users WHERE id = $1
      `, [decoded.userId]);

      if (result.rows.length > 0) {
        req.user = result.rows[0];
      }
    }

    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireOwnershipOrRole,
  optionalAuth
};
