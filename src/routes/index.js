import express from 'express';
import userRoutes from './userRoutes.js';
// import vehicleRoutes from './vehicleRoutes.js';
// import parkingRoutes from './parkingRoutes.js';
// import bookingRoutes from './bookingRoutes.js';
// import paymentRoutes from './paymentRoutes.js';
// import sensorRoutes from './sensorRoutes.js';

const router = express.Router();

// API version prefix
const API_PREFIX = '/v1';

// Define route handlers
router.use(`${API_PREFIX}/users`, userRoutes);
// router.use(`${API_PREFIX}/vehicles`, vehicleRoutes);
// router.use(`${API_PREFIX}/parking`, parkingRoutes);
// router.use(`${API_PREFIX}/bookings`, bookingRoutes);
// router.use(`${API_PREFIX}/payments`, paymentRoutes);
// router.use(`${API_PREFIX}/sensors`, sensorRoutes);

// Root route for API
router.get(`${API_PREFIX}`, (req, res) => {
  res.json({
    message: 'Smart Parking API',
    version: '1.0.0',
    status: 'online'
  });
});

// 404 handler for API routes
router.use(`${API_PREFIX}/*`, (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource does not exist'
  });
});

export default router;
