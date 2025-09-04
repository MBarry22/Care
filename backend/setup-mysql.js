#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up SeniorCare Connect Backend with MySQL...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    console.log('📝 Creating .env file from template...');
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created with MySQL configuration.\n');
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

// MySQL setup instructions
console.log('🗄️  MySQL Database Setup Required:');
console.log('1. Make sure MySQL is running on your system');
console.log('2. Create the database: mysql -u root -p -e "CREATE DATABASE seniorcare_db;"');
console.log('3. Run the schema: mysql -u root -p seniorcare_db < src/database/schema.sql');
console.log('4. Your .env file is already configured with:');
console.log('   - Host: localhost');
console.log('   - Port: 3306');
console.log('   - Username: root');
console.log('   - Password: @Portermason877687');
console.log('   - Database: seniorcare_db\n');

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

console.log('🎉 MySQL setup complete! Next steps:');
console.log('1. Make sure MySQL is running');
console.log('2. Create the database: mysql -u root -p -e "CREATE DATABASE seniorcare_db;"');
console.log('3. Run the schema: mysql -u root -p seniorcare_db < src/database/schema.sql');
console.log('4. Edit .env file with your JWT secrets and email configuration');
console.log('5. Run: npm run dev');
console.log('6. Test the API at: http://localhost:3000/health\n');

console.log('📚 For more information, see README.md');
