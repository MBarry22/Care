#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up SeniorCare Connect Backend...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    console.log('📝 Creating .env file from template...');
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created. Please edit it with your configuration.\n');
  } else {
    console.log('❌ env.example file not found. Please create a .env file manually.\n');
  }
} else {
  console.log('✅ .env file already exists.\n');
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit', cwd: __dirname });
    console.log('✅ Dependencies installed successfully.\n');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Dependencies already installed.\n');
}

// Database setup instructions
console.log('🗄️  Database Setup Required:');
console.log('1. Install PostgreSQL if not already installed');
console.log('2. Create a database: createdb seniorcare_db');
console.log('3. Run the schema: psql seniorcare_db < src/database/schema.sql');
console.log('4. Update your .env file with database credentials\n');

// Email setup instructions
console.log('📧 Email Setup Required:');
console.log('1. Configure email settings in .env file');
console.log('2. For Gmail, use an App Password (not your regular password)');
console.log('3. Update EMAIL_FROM to your domain email\n');

// JWT setup instructions
console.log('🔐 Security Setup Required:');
console.log('1. Generate strong JWT secrets and update .env file');
console.log('2. You can use: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
console.log('3. Update JWT_SECRET and JWT_REFRESH_SECRET\n');

console.log('🎉 Setup complete! Next steps:');
console.log('1. Edit .env file with your configuration');
console.log('2. Set up PostgreSQL database');
console.log('3. Run: npm run dev');
console.log('4. Test the API at: http://localhost:3000/health\n');

console.log('📚 For more information, see README.md');
