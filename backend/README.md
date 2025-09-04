# SeniorCare Connect Backend API

A comprehensive Node.js/Express backend API for the SeniorCare Connect platform, providing secure authentication, data management, and real-time communication features.

## 🏗️ Architecture

- **Framework**: Node.js with Express.js
- **Database**: PostgreSQL with connection pooling
- **Authentication**: JWT tokens with refresh token rotation
- **Security**: Helmet, CORS, rate limiting, input validation
- **Email**: Nodemailer for verification and password reset
- **Validation**: Express-validator for request validation

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

### Installation

1. **Clone and install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Set up PostgreSQL database**
   ```bash
   # Create database
   createdb seniorcare_db
   
   # Run schema
   psql seniorcare_db < src/database/schema.sql
   ```

4. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 📊 Database Schema

The database includes the following main tables:

- **users**: User accounts with role-based access
- **family_relationships**: Family member connections
- **medications**: Medication tracking and reminders
- **appointments**: Calendar and scheduling
- **health_entries**: Health data and vitals tracking
- **messages**: Communication between users
- **caregivers**: Professional caregiver profiles
- **emergency_contacts**: Emergency contact information
- **refresh_tokens**: JWT refresh token management

## 🔐 Authentication

### JWT Token System
- **Access Token**: Short-lived (24h) for API access
- **Refresh Token**: Long-lived (7d) for token renewal
- **Secure Storage**: Tokens stored in database with expiration

### User Roles
- **senior**: Primary users with full access
- **family**: Family members managing care
- **caregiver**: Professional caregivers

### Security Features
- Password hashing with bcrypt
- Rate limiting (100 requests/15min)
- Input validation and sanitization
- CORS protection
- Helmet security headers

## 📡 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /refresh` - Refresh access token
- `POST /logout` - User logout
- `POST /forgot-password` - Password reset request
- `POST /reset-password` - Password reset
- `POST /verify-email` - Email verification

### Users (`/api/users`)
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `GET /family` - Get family members
- `POST /family` - Add family member
- `DELETE /family/:id` - Remove family member
- `GET /emergency-contacts` - Get emergency contacts
- `POST /emergency-contacts` - Add emergency contact

### Medications (`/api/medications`)
- `GET /` - Get medications
- `POST /` - Add medication
- `PUT /:id` - Update medication
- `DELETE /:id` - Delete medication

### Appointments (`/api/appointments`)
- `GET /` - Get appointments
- `POST /` - Add appointment
- `PUT /:id` - Update appointment
- `DELETE /:id` - Delete appointment

### Health (`/api/health`)
- `GET /` - Get health entries
- `POST /` - Add health entry
- `PUT /:id` - Update health entry
- `DELETE /:id` - Delete health entry
- `GET /trends` - Get health trends

### Messages (`/api/messages`)
- `GET /` - Get messages
- `POST /` - Send message
- `PUT /:id/read` - Mark as read
- `PUT /read-all` - Mark all as read
- `GET /unread-count` - Get unread count
- `GET /conversations` - Get conversation list

### Caregivers (`/api/caregivers`)
- `GET /` - Get available caregivers
- `GET /:id` - Get caregiver profile
- `POST /` - Create caregiver profile
- `PUT /:id` - Update caregiver profile
- `GET /assignments` - Get assignments
- `POST /assignments` - Create assignment

## 🔧 Configuration

### Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=seniorcare_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=noreply@seniorcareconnect.ca

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Frontend
FRONTEND_URL=http://localhost:8081
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## 📈 Monitoring

### Health Check
- `GET /health` - API health status

### Logging
- Morgan for HTTP request logging
- Console logging for errors and important events
- Structured logging for production monitoring

## 🚀 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT secrets
- [ ] Configure SSL/TLS
- [ ] Set up database backups
- [ ] Configure email service
- [ ] Set up monitoring and logging
- [ ] Configure rate limiting
- [ ] Set up CORS for production domain

### Docker Deployment
```bash
# Build image
docker build -t seniorcare-backend .

# Run container
docker run -p 3000:3000 --env-file .env seniorcare-backend
```

### Cloud Deployment
- **AWS**: EC2, RDS, S3, CloudFront
- **Google Cloud**: Compute Engine, Cloud SQL, Cloud Storage
- **Azure**: App Service, SQL Database, Blob Storage

## 🔒 Security Considerations

### Data Protection
- All passwords hashed with bcrypt
- JWT tokens with secure secrets
- Input validation and sanitization
- SQL injection prevention
- XSS protection

### Privacy Compliance
- PIPEDA compliance for Canadian users
- Data encryption in transit and at rest
- User consent management
- Data retention policies
- Audit logging

### API Security
- Rate limiting to prevent abuse
- CORS configuration
- Helmet security headers
- Request size limits
- Error message sanitization

## 📞 Support

For technical support or questions:
- Email: tech@seniorcareconnect.ca
- Documentation: [API Docs](https://docs.seniorcareconnect.ca)
- Issues: [GitHub Issues](https://github.com/seniorcareconnect/backend/issues)

---

**SeniorCare Connect Backend** - Secure, scalable, and reliable API for senior care coordination. 🏥
