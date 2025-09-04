#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
require('dotenv').config();

console.log('🚀 Testing Backend Server...\n');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test auth endpoint
app.post('/api/auth/test', (req, res) => {
  res.json({
    success: true,
    message: 'Auth endpoint is working!',
    data: {
      received: req.body
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend server started on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Test auth endpoint: http://localhost:${PORT}/api/auth/test`);
  console.log('\n📱 To test from your app:');
  console.log(`   Set EXPO_PUBLIC_API_URL=http://localhost:${PORT}/api`);
  console.log('\n⏹️  Press Ctrl+C to stop the server');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server...');
  process.exit(0);
});
