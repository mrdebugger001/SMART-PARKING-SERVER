const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

// Import routes
const routes = require('./src/routes');

// Load environment variables
dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(helmet()); // Helps secure Express apps with various HTTP headers
app.use(express.json()); // Parse JSON request bodies
app.use(morgan('dev')); // HTTP request logger

// Use routes
app.use('/', routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error occurred:', err.stack);
  res.status(500).json({
    message: 'Something went wrong',
    error: process.env.NODE_ENV === 'production' ? null : err.message
  });
});

// Start server
async function startServer() {
  try {
    // Connect to the database
    await prisma.$connect();
    console.log('✅ Database connection successful');
    console.log(`📦 Connected to database: ${process.env.POSTGRES_DB}`);
    console.log(`🌐 Database host: ${process.env.POSTGRES_HOST}`);
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔗 API URL: http://localhost:${PORT}`);
      console.log('📝 API Documentation available at /api/v1');
    });
  } catch (error) {
    console.error('❌ Database connection failed');
    console.error('Error details:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('📤 Database connection closed');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  console.log('📤 Database connection closed');
  process.exit(0);
});

// At the bottom of app.js
if (require.main === module) {
  startServer(); // ✅ Only start server when run directly (not when imported by inspector.js)
}



module.exports = app; // ✅ Still export app for inspector.js to use
