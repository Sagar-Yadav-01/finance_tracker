const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./routes/authRoutes');
const { checkDatabaseConnection } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5005;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Personal Finance Backend API is running' });
});

app.use('/api/auth', authRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[UNHANDLED SERVER ERROR]', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Start Server
app.listen(PORT, async () => {
  console.log(`==================================================`);
  console.log(`Personal Finance Express Backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`==================================================`);

  try {
    await checkDatabaseConnection();
    console.log('[DATABASE CONNECTED] Successfully connected to MySQL database.');
  } catch (err) {
    console.warn('[DATABASE CONNECTION WARNING] MySQL server is currently unreachable.');
    console.warn('Note: Signup and Login require MySQL to be running and configured in server/.env.');
  }
});
