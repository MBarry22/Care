#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up SeniorCare Connect Backend with DigitalOcean MySQL...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    console.log('📝 Creating .env file from template...');
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created with DigitalOcean configuration.\n');
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

// DigitalOcean MySQL setup instructions
console.log('🗄️  DigitalOcean MySQL Database Setup:');
console.log('1. Your database is already created on DigitalOcean');
console.log('2. Download CA certificate from DigitalOcean:');
console.log('   - Log into DigitalOcean account');
console.log('   - Go to your database cluster');
console.log('   - Navigate to "Connection Details" section');
console.log('   - Download the CA certificate file');
console.log('   - Place it in: ./certs/ca-certificate.crt');
console.log('3. Run the schema to create tables:');
console.log('   mysql -h iwcdcms-do-user-16043617-0.c.db.ondigitalocean.com -P 25060 -u doadmin -p --ssl-mode=REQUIRED --ssl-ca=./certs/ca-certificate.crt seniorcare_db < src/database/schema.sql');
console.log('4. Your .env file is configured with:');
console.log('   - Host: iwcdcms-do-user-16043617-0.c.db.ondigitalocean.com');
console.log('   - Port: 25060');
console.log('   - Username: doadmin');
console.log('   - Password: ************************');
console.log('   - Database: seniorcare_db');
console.log('   - SSL: Enabled with CA certificate\n');

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

console.log('🎉 DigitalOcean setup complete! Next steps:');
console.log('1. Download and place CA certificate in ./certs/ca-certificate.crt');
console.log('2. Run the database schema:');
console.log('   mysql -h iwcdcms-do-user-16043617-0.c.db.ondigitalocean.com -P 25060 -u doadmin -p --ssl-mode=REQUIRED --ssl-ca=./certs/ca-certificate.crt seniorcare_db < src/database/schema.sql');
console.log('3. Edit .env file with your JWT secrets and email configuration');
console.log('4. Run: npm run dev');
console.log('5. Test the API at: http://localhost:3000/health\n');

console.log('📚 For more information, see README.md');
