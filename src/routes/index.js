import express from 'express';
import userRoutes from './userRoutes.js';
// import vehicleRoutes from './vehicleRoutes.js';
// import parkingRoutes from './parkingRoutes.js';
// import bookingRoutes from './bookingRoutes.js';
// import paymentRoutes from './paymentRoutes.js';
// import sensorRoutes from './sensorRoutes.js';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
router.use('/users', userRoutes);
// router.use(`${API_PREFIX}/vehicles`, vehicleRoutes);
// router.use(`${API_PREFIX}/parking`, parkingRoutes);
// router.use(`${API_PREFIX}/bookings`, bookingRoutes);
// router.use(`${API_PREFIX}/payments`, paymentRoutes);
// router.use(`${API_PREFIX}/sensors`, sensorRoutes);

// API documentation route
router.get('/docs', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API Documentation',
    endpoints: {
      users: {
        register: {
          method: 'POST',
          url: '/api/users/register',
          description: 'Register a new user',
          bodyParams: ['name', 'email', 'password', 'role']
        },
        login: {
          method: 'POST',
          url: '/api/users/login',
          description: 'Authenticate user & get tokens',
          bodyParams: ['email', 'password']
        },
        logout: {
          method: 'POST',
          url: '/api/users/logout',
          description: 'Logout user & invalidate refresh token',
          bodyParams: ['refreshToken']
        },
        verifyToken: {
          method: 'POST',
          url: '/api/users/verify',
          description: 'Verify access token',
          bodyParams: ['accessToken']
        }
      }
    }
  });
});

// Root route for API
router.get('/', (req, res) => {
  res.json({
    message: 'API Server',
    version: '1.0.0',
    status: 'online'
  });
});

// 404 handler for API routes
router.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'The requested resource does not exist'
  });
});

export default router;
