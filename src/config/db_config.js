import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import colors from 'colors';

// Load environment variables
dotenv.config();

// Initialize Prisma client with logging
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Database connection check with timeout
async function checkDatabaseConnection() {
  try {
    const connectPromise = prisma.$connect();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), 5000)
    );

    await Promise.race([connectPromise, timeoutPromise]);
    return true;
  } catch (error) {
    console.error('Database connection error:', error.message.red);
    return false;
  }
}

// Enhanced shutdown handling
async function gracefulShutdown(signal) {
  console.log(`\n📥 Received ${signal}. Starting graceful shutdown...`.yellow);
  try {
    await prisma.$disconnect();
    console.log('📤 Database connection closed successfully'.green);
    process.exit(0);
  } catch (error) {
    console.log('❌ Error during graceful shutdown:'.red);
    console.error(error);
    process.exit(1);
  }
}

// Setup shutdown handlers
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Monitor database queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    console.log('👉 Query: '.blue + e.query);
    console.log('⏱️  Duration: '.yellow + `${e.duration}ms\n`);
  });
}

export { prisma, checkDatabaseConnection };
