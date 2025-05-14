import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import colors from 'colors';
import { networkInterfaces } from 'os';  // Fix for the require error

// Import database configuration
import { prisma, checkDatabaseConnection } from './src/config/db_config.js';

// Import routes
import routes from './src/routes/index.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware setup
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));
app.use('/api', routes);

// Helper function to get IP address
function getIpAddress() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

// Enhanced server startup with detailed debugging
async function startServer() {
  console.clear();
  console.log('\n🚀 Initializing server...'.yellow);
  console.log('----------------------------------'.gray);

  try {
    // Check database connection
    console.log('📡 Checking database connection...'.cyan);
    const isConnected = await checkDatabaseConnection();

    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    // Parse database URL for info display
    const dbUrl = new URL(process.env.DATABASE_URL);
    
    // Database connection successful
    console.log('\n✅ Database Connection Status:'.green);
    console.log('----------------------------------'.gray);
    console.log(`🔗 Host: ${dbUrl.hostname}`.green);
    console.log(`📦 Database: ${dbUrl.pathname.split('/')[1]}`.green);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`.green);

    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log('\n🚀 Server Status:'.green);
      console.log('----------------------------------'.gray);
      console.log(`📡 Server running on port: ${PORT}`.green);
      console.log(`🔗 Local URL: http://localhost:${PORT}`.cyan);
      console.log(`🔗 Network URL: http://${getIpAddress()}:${PORT}`.cyan);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs\n`.cyan);
    });

  } catch (error) {
    console.log('\n❌ Startup Error:'.red);
    console.log('----------------------------------'.gray);
    console.log('🔴 Server failed to start'.red);
    console.log(`⚠️  Error: ${error.message}`.red);
    console.log(`🔍 Code: ${error.code || 'N/A'}`.red);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('\n🔍 Detailed Error Stack:'.yellow);
      console.log(error.stack.red);
    }

    await prisma.$disconnect();
    process.exit(1);
  }
}

// Start server
startServer().catch(console.error);

export default app;
