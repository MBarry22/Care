#!/usr/bin/env node

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🔍 Testing DigitalOcean MySQL Connection...\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log(`DB_HOST: ${process.env.DB_HOST || 'NOT SET'}`);
console.log(`DB_PORT: ${process.env.DB_PORT || 'NOT SET'}`);
console.log(`DB_NAME: ${process.env.DB_NAME || 'NOT SET'}`);
console.log(`DB_USER: ${process.env.DB_USER || 'NOT SET'}`);
console.log(`DB_PASSWORD: ${process.env.DB_PASSWORD ? '***SET***' : 'NOT SET'}`);
console.log(`DB_SSL: ${process.env.DB_SSL || 'NOT SET'}`);
console.log(`DB_SSL_CA_PATH: ${process.env.DB_SSL_CA_PATH || 'NOT SET'}\n`);

// Check if CA certificate exists
if (process.env.DB_SSL_CA_PATH) {
  const caPath = path.resolve(process.env.DB_SSL_CA_PATH);
  if (fs.existsSync(caPath)) {
    console.log(`✅ CA Certificate found: ${caPath}`);
  } else {
    console.log(`❌ CA Certificate NOT found: ${caPath}`);
  }
} else {
  console.log('⚠️  No CA certificate path specified');
}

console.log('\n🔌 Testing Database Connection...');

// SSL configuration
const getSSLConfig = () => {
  if (process.env.DB_SSL !== 'true') {
    return false;
  }

  const sslConfig = {
    rejectUnauthorized: false,
  };

  if (process.env.DB_SSL_CA_PATH) {
    const caPath = path.resolve(process.env.DB_SSL_CA_PATH);
    if (fs.existsSync(caPath)) {
      sslConfig.ca = fs.readFileSync(caPath);
      sslConfig.rejectUnauthorized = true;
    }
  }

  return sslConfig;
};

// Test connection
async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: getSSLConfig(),
    });

    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Database query successful:', rows[0]);
    
    await connection.end();
    console.log('✅ Connection closed successfully');
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Possible solutions:');
      console.log('- Check your username and password');
      console.log('- Verify the user has access to the database');
    } else if (error.code === 'ENOTFOUND') {
      console.log('\n💡 Possible solutions:');
      console.log('- Check your hostname');
      console.log('- Verify your internet connection');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Possible solutions:');
      console.log('- Check your port number');
      console.log('- Verify the database server is running');
    }
  }
}

testConnection();
