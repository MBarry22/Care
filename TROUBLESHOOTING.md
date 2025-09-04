# 🚨 Troubleshooting Guide

## "Network Request Failed" Error

This error occurs when the frontend can't connect to the backend API. Here's how to fix it:

### 🔍 **Step 1: Check Backend Server**

1. **Navigate to backend directory:**
   ```bash
   cd HealthCare/backend
   ```

2. **Install dependencies (if not done):**
   ```bash
   npm install
   ```

3. **Create .env file:**
   ```bash
   cp env.example .env
   # Edit .env with your actual values
   ```

4. **Start the backend server:**
   ```bash
   npm run dev
   ```

5. **Verify server is running:**
   - You should see: `✅ Server running on port 3000`
   - Open browser: http://localhost:3000/health
   - Should show: `{"success":true,"message":"Server is running"}`

### 🔍 **Step 2: Test Database Connection**

1. **Run database connection test:**
   ```bash
   cd HealthCare/backend
   node test-connection.js
   ```

2. **Expected output:**
   ```
   ✅ Database connection successful!
   ✅ Database query successful: { test: 1 }
   ```

3. **If connection fails:**
   - Check your `.env` file has correct database credentials
   - Ensure CA certificate is in `backend/certs/ca-certificate.crt`
   - Verify DigitalOcean database is accessible

### 🔍 **Step 3: Test Simple Server**

If the main server has issues, test with a simple server:

```bash
cd HealthCare/backend
node test-server.js
```

This will start a minimal server on port 3000 to test connectivity.

### 🔍 **Step 4: Check Frontend Configuration**

1. **Verify API URL in frontend:**
   - The app uses: `http://localhost:3000/api`
   - If your backend runs on different port, update it

2. **Test connection from app:**
   - The register screen now tests connection before attempting registration
   - Look for "Connection Error" dialog with specific instructions

### 🔍 **Step 5: Common Issues & Solutions**

#### **Port 3000 Already in Use**
```bash
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill the process (Windows)
taskkill /PID <PID_NUMBER> /F

# Or change port in .env
PORT=3001
```

#### **Database Connection Issues**
- **Missing CA Certificate:** Download from DigitalOcean and place in `backend/certs/ca-certificate.crt`
- **Wrong Credentials:** Double-check username, password, host, and port in `.env`
- **SSL Issues:** Ensure `DB_SSL=true` and certificate path is correct

#### **CORS Issues**
The backend includes CORS middleware, but if you still have issues:
```javascript
// In backend/src/server.js, ensure CORS is configured:
app.use(cors({
  origin: ['http://localhost:8081', 'http://localhost:19006'],
  credentials: true
}));
```

#### **Environment Variables Not Loading**
```bash
# Check if .env file exists
ls -la .env

# Verify .env content (don't show passwords)
cat .env | grep -v PASSWORD
```

### 🔍 **Step 6: Debug Mode**

Enable debug logging in the backend:

1. **Add to .env:**
   ```env
   NODE_ENV=development
   DEBUG=*
   ```

2. **Check console output for detailed error messages**

### 🔍 **Step 7: Network Testing**

Test if the frontend can reach the backend:

1. **From your phone/emulator, try accessing:**
   - http://localhost:3000/health
   - http://localhost:3000/api/auth/test

2. **If using physical device, replace localhost with your computer's IP:**
   - Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
   - Use: http://192.168.1.XXX:3000/health

### 🔍 **Step 8: Complete Setup Checklist**

- [ ] Backend dependencies installed (`npm install`)
- [ ] `.env` file created with correct values
- [ ] CA certificate downloaded and placed in `certs/ca-certificate.crt`
- [ ] Database schema run successfully
- [ ] Backend server starts without errors
- [ ] Health endpoint responds: http://localhost:3000/health
- [ ] Frontend can connect to backend

### 🆘 **Still Having Issues?**

1. **Check the console logs** in both frontend and backend
2. **Verify all environment variables** are set correctly
3. **Test with the simple server** (`node test-server.js`)
4. **Check firewall settings** - ensure port 3000 is accessible
5. **Try a different port** if 3000 is blocked

### 📞 **Getting Help**

If you're still stuck, provide:
1. Backend console output
2. Frontend error messages
3. Your `.env` file (without passwords)
4. Results of `node test-connection.js`
