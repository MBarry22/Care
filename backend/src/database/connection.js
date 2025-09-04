const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// SSL configuration for DigitalOcean
const getSSLConfig = () => {
  if (process.env.DB_SSL !== 'true') {
    return false;
  }

  const sslConfig = {
    rejectUnauthorized: false,
  };

  // Add CA certificate if provided
  if (process.env.DB_SSL_CA_PATH) {
    const caPath = path.resolve(process.env.DB_SSL_CA_PATH);
    if (fs.existsSync(caPath)) {
      sslConfig.ca = fs.readFileSync(caPath);
      sslConfig.rejectUnauthorized = true;
      console.log(`✅ Using CA certificate: ${caPath}`);
    } else {
      console.warn(`⚠️  CA certificate not found at: ${caPath}`);
    }
  }

  return sslConfig;
};

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'seniorcare_db',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  ssl: getSSLConfig(),
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  acquireTimeout: 2000,
  timeout: 30000,
});

// Test database connection
const connectDB = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    
    // Test query
    const [rows] = await connection.execute('SELECT NOW() as now');
    console.log('📅 Database time:', rows[0].now);
    
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
};

// Query helper function
const query = async (text, params) => {
  const start = Date.now();
  try {
    const [rows, fields] = await pool.execute(text, params);
    const duration = Date.now() - start;
    console.log('🔍 Executed query', { text, duration, rows: rows.length });
    return { rows, fields };
  } catch (error) {
    console.error('❌ Query error:', error);
    throw error;
  }
};

// Transaction helper
const transaction = async (callback) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  pool,
  connectDB,
  query,
  transaction
};
