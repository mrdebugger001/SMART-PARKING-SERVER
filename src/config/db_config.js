import { PrismaClient } from '../../generated/prisma-client/index.js';
import dotenv from 'dotenv';
import colors from 'colors';

// Load environment variables
dotenv.config();

// Initialize Prisma client with extended logging in development
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error'] 
    : ['warn', 'error'],
});

// Debug models available in Prisma client
console.log('\n📚 DATABASE CONNECTION - Available Prisma models:'.green);
console.log(Object.keys(prisma).filter(key => !key.startsWith('_')).join(', ').cyan);

/**
 * Test database connection and return connection status
 * @returns {Promise<boolean>} Connection status
 */
export const checkDatabaseConnection = async () => {
  const startTime = Date.now();
  try {
    console.log('🔄 Connecting to database...'.yellow);
    
    // Simple query to check connection
    await prisma.$queryRaw`SELECT 1 as result`;
    
    const endTime = Date.now();
    const connectionTime = endTime - startTime;
    
    console.log(`✅ Database connected successfully in ${connectionTime}ms`.green);
    return true;
  } catch (error) {
    const endTime = Date.now();
    const connectionTime = endTime - startTime;
    
    console.error(`❌ Database connection failed after ${connectionTime}ms`.red);
    console.error(`🔴 Error: ${error.message}`.red);
    
    // More detailed error handling for different scenarios
    if (error.code === 'P1001') {
      console.error('🔍 Cannot reach database server. Please check your connection.'.red);
    } else if (error.code === 'P1003') {
      console.error('🔍 Database does not exist. Please check your DATABASE_URL.'.red);
    } else if (error.code === 'P1012') {
      console.error('🔍 Prisma schema validation error. Run prisma validate.'.red);
    } else if (error.code === 'P1017') {
      console.error('🔍 Server has closed the connection.'.red);
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.error(`🔍 Detailed error: ${JSON.stringify(error, null, 2)}`.yellow);
    }
    
    return false;
  }
};

/**
 * Gracefully shut down the Prisma client
 */
export const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect();
    console.log('📤 Database disconnected successfully'.green);
  } catch (error) {
    console.error('❌ Error disconnecting from database'.red, error);
    process.exit(1);
  }
};

// Handle process termination signals
process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...'.yellow);
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...'.yellow);
  await disconnectDatabase();
  process.exit(0);
});

// Monitor database queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    console.log('👉 Query: '.blue + e.query);
    console.log('⏱️  Duration: '.yellow + `${e.duration}ms\n`);
  });
}
