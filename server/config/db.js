const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

// Explicitly load server/.env using absolute path relative to config directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME || 'personal_finance_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 5000
};

let pool = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
    if (pool && pool.on) {
      pool.on('error', (err) => {
        console.warn('[MYSQL POOL WARNING]', err.message);
      });
    }
  }
  return pool;
}

// Initial pool instantiation
getPool();

/**
 * Ensures database, user table schema exist, and verifies MySQL connection.
 */
async function checkDatabaseConnection() {
  const currentPool = getPool();
  
  // Safe debug log (NO password printed)
  const isPassLoaded = process.env.DB_PASSWORD !== undefined;
  console.log(`[DATABASE CONFIG] Host: ${dbConfig.host}:${dbConfig.port} | User: ${dbConfig.user} | Database: ${dbConfig.database} | Password Loaded: ${isPassLoaded ? 'YES' : 'NO'}`);

  try {
    const connection = await currentPool.getConnection();
    
    // Ensure required authentication table schema exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    connection.release();
    return true;
  } catch (err) {
    // Auto-create database if unknown database error
    if (err.code === 'ER_BAD_DB_ERROR') {
      try {
        console.log(`[DATABASE AUTO-SETUP] Database '${dbConfig.database}' does not exist. Creating...`);
        const rootConn = await mysql.createConnection({
          host: dbConfig.host,
          port: dbConfig.port,
          user: dbConfig.user,
          password: dbConfig.password
        });
        await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
        await rootConn.end();
        console.log(`[DATABASE AUTO-SETUP] Database '${dbConfig.database}' created successfully.`);
        
        // Retry connection & table creation via pool
        const conn = await currentPool.getConnection();
        await conn.query(`
          CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_email (email)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        conn.release();
        return true;
      } catch (setupErr) {
        console.warn(`[DATABASE CONFIGURATION ERROR] MySQL connection failed on ${dbConfig.host}:${dbConfig.port}.`);
        console.warn(`Details: ${setupErr.message}`);
        throw setupErr;
      }
    }

    console.warn(`[DATABASE CONFIGURATION ERROR] MySQL connection failed on ${dbConfig.host}:${dbConfig.port}.`);
    console.warn(`Details: ${err.message}`);
    throw err;
  }
}

module.exports = {
  get pool() {
    return getPool();
  },
  checkDatabaseConnection
};

