import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Import routes
import routes from './src/routes/index.js'; // Adjust path if needed

// Load environment variables
dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(helmet()); // Secure headers
app.use(express.json()); // JSON parser
app.use(morgan('dev')); // Logger

// Use routes
app.use('/', routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error occurred:', err.stack);
  res.status(500).json({
    message: 'Something went wrong',
    error: process.env.NODE_ENV === 'production' ? null : err.message,
  });
});

// Start server
async function startServer() {
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful');
    console.log(`📦 Connected to database: ${process.env.POSTGRES_DB}`);
    console.log(`🌐 Database host: ${process.env.POSTGRES_HOST}`);

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

// Graceful shutdown
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

// Start only if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export default app; // Export for use in other modules (e.g., inspector.js)
