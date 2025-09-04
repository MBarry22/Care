# 🚀 SeniorCare Connect - Complete Setup Guide

This guide will help you set up the complete SeniorCare Connect platform with both frontend and backend components.

## 📋 Prerequisites

Before starting, ensure you have:

- **Node.js 18+** installed
- **PostgreSQL 12+** installed
- **Git** installed
- **Expo CLI** installed (`npm install -g @expo/cli`)
- **Code editor** (VS Code recommended)

## 🏗️ Backend Setup

### 1. Install Backend Dependencies

```bash
cd HealthCare/backend
npm install
```

### 2. Set Up Environment Variables

```bash
# Copy the example environment file
cp env.example .env

# Edit .env with your configuration
```

**Required .env Configuration:**

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=iwcdcms-do-user-16043617-0.c.db.ondigitalocean.com
DB_PORT=25060
DB_NAME=seniorcare_db
DB_USER=doadmin
DB_PASSWORD=************************
DB_SSL=true
DB_SSL_CA_PATH=./certs/ca-certificate.crt

# JWT Configuration (Generate strong secrets)
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=noreply@seniorcareconnect.ca

# Frontend URL
FRONTEND_URL=http://localhost:8081
```

### 3. Set Up DigitalOcean MySQL Database

#### 3.1 Download CA Certificate
1. Log into your DigitalOcean account
2. Go to your database cluster
3. Navigate to "Connection Details" section
4. Download the CA certificate file
5. Place it in `backend/certs/ca-certificate.crt`

#### 3.2 Run Database Schema
The database is already created on DigitalOcean. Run the schema:

```bash
# Run schema on DigitalOcean database with SSL
mysql -h iwcdcms-do-user-16043617-0.c.db.ondigitalocean.com -P 25060 -u doadmin -p --ssl-mode=REQUIRED --ssl-ca=./certs/ca-certificate.crt seniorcare_db < src/database/schema.sql
```

### 4. Generate JWT Secrets

```bash
# Generate strong JWT secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

### 5. Start Backend Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

**Test the backend:**
- Health check: http://localhost:3000/health
- API base: http://localhost:3000/api

## 📱 Frontend Setup

### 1. Install Frontend Dependencies

```bash
cd HealthCare
npm install
```

### 2. Configure API Connection

Update the API URL in your environment:

```bash
# Create .env file in HealthCare directory
echo "EXPO_PUBLIC_API_URL=http://localhost:3000/api" > .env
```

### 3. Start Frontend Development Server

```bash
# Start Expo development server
npm start

# Or start specific platforms
npm run ios
npm run android
npm run web
```

## 🧪 Testing the Complete System

### 1. Test Backend API

```bash
# Test health endpoint
curl http://localhost:3000/health

# Test registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "role": "senior"
  }'
```

### 2. Test Frontend Authentication

1. Open the app in your browser/emulator
2. Try registering a new account
3. Test login with the registered account
4. Verify you can access the main app

### 3. Test Demo Accounts

The app includes demo accounts for testing:

- **Senior**: `margaret@example.com` / `password123`
- **Family**: `sarah@example.com` / `password123`
- **Caregiver**: `maria@example.com` / `password123`

## 🔧 Configuration Options

### Database Options

**DigitalOcean MySQL (Current Setup):**
```env
DB_HOST=iwcdcms-do-user-16043617-0.c.db.ondigitalocean.com
DB_PORT=25060
DB_NAME=seniorcare_db
DB_USER=doadmin
DB_PASSWORD=************************
DB_SSL=true
DB_SSL_CA_PATH=./certs/ca-certificate.crt
```

**Other Cloud Database Options:**
- AWS RDS MySQL
- Google Cloud SQL MySQL
- Azure Database for MySQL

### Email Configuration

**Gmail (Development):**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

**Production Email Services:**
- SendGrid
- AWS SES
- Mailgun

### Frontend Configuration

**Development:**
```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

**Production:**
```env
EXPO_PUBLIC_API_URL=https://api.seniorcareconnect.ca
```

## 🚀 Deployment Options

### Backend Deployment

**Option 1: Heroku**
```bash
# Install Heroku CLI
# Create Heroku app
heroku create seniorcare-backend

# Set environment variables
heroku config:set JWT_SECRET=your_secret
heroku config:set DB_URL=your_database_url

# Deploy
git push heroku main
```

**Option 2: AWS EC2**
```bash
# Launch EC2 instance
# Install Node.js and PostgreSQL
# Clone repository
# Set up environment
# Use PM2 for process management
pm2 start src/server.js --name seniorcare-api
```

**Option 3: Docker**
```bash
# Build image
docker build -t seniorcare-backend .

# Run container
docker run -p 3000:3000 --env-file .env seniorcare-backend
```

### Frontend Deployment

**Expo Application Services (EAS):**
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure EAS
eas build:configure

# Build for production
eas build --platform all

# Submit to app stores
eas submit --platform all
```

## 🔒 Security Checklist

### Backend Security
- [ ] Strong JWT secrets (64+ characters)
- [ ] Secure database credentials
- [ ] HTTPS in production
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Input validation enabled
- [ ] Error messages sanitized

### Frontend Security
- [ ] API keys in environment variables
- [ ] Secure token storage
- [ ] Input validation
- [ ] Error handling
- [ ] Network security

## 📊 Monitoring & Logging

### Backend Monitoring
```bash
# Install monitoring tools
npm install --save morgan winston

# Set up logging
# Configure health checks
# Set up error tracking (Sentry)
```

### Database Monitoring
```bash
# Set up database backups
# Configure connection pooling
# Monitor query performance
# Set up alerts
```

## 🧪 Testing

### Backend Testing
```bash
# Install testing dependencies
npm install --save-dev jest supertest

# Run tests
npm test

# Run with coverage
npm run test:coverage
```

### Frontend Testing
```bash
# Install testing dependencies
npm install --save-dev @testing-library/react-native

# Run tests
npm test
```

## 🆘 Troubleshooting

### Common Issues

**Backend won't start:**
- Check DigitalOcean database connection
- Verify database credentials and SSL settings
- Check if port 3000 is available

**Frontend can't connect to backend:**
- Verify backend is running
- Check API URL configuration
- Check CORS settings

**Authentication issues:**
- Verify JWT secrets are set
- Check token expiration settings
- Verify user exists in database

**Database connection issues:**
- Check DigitalOcean database is accessible
- Verify SSL connection settings and CA certificate
- Ensure CA certificate is in `backend/certs/ca-certificate.crt`
- Check user permissions and credentials
- Ensure database exists on DigitalOcean
- Verify certificate file permissions

### Getting Help

1. Check the logs for error messages
2. Verify all environment variables are set
3. Test each component individually
4. Check network connectivity
5. Review the documentation

## 📚 Next Steps

Once your system is running:

1. **User Testing**: Test with real users
2. **Data Migration**: Import existing data if needed
3. **Performance Optimization**: Monitor and optimize
4. **Security Audit**: Review security measures
5. **Backup Strategy**: Implement data backups
6. **Monitoring**: Set up production monitoring

## 🎉 Success!

If everything is working correctly, you should have:

- ✅ Backend API running on port 3000
- ✅ Frontend app running on port 8081
- ✅ Database connected and schema loaded
- ✅ Authentication working
- ✅ All features accessible

Your SeniorCare Connect platform is now ready for development and testing! 🚀

---

**Need help?** Check the individual README files in each directory or create an issue in the repository.
