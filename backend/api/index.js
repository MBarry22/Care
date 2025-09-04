// Simple API for Vercel deployment
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'SeniorCare Connect API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test auth endpoint
app.post('/api/auth/register', (req, res) => {
  const { email, password, name, role } = req.body;
  
  // Simple validation
  if (!email || !password || !name || !role) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }

  // Mock successful registration
  res.json({
    success: true,
    message: 'Registration successful!',
    data: {
      user: {
        id: 'mock-user-id',
        email,
        name,
        role,
        isVerified: false,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token'
    }
  });
});

// Test login endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Simple validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  // Mock successful login
  res.json({
    success: true,
    message: 'Login successful!',
    data: {
      user: {
        id: 'mock-user-id',
        email,
        name: 'Test User',
        role: 'senior',
        isVerified: true,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token'
    }
  });
});

// Catch all route
app.get('*', (req, res) => {
  res.json({
    success: true,
    message: 'SeniorCare Connect API',
    endpoints: [
      'GET /health',
      'POST /api/auth/register',
      'POST /api/auth/login'
    ]
  });
});

module.exports = app;
