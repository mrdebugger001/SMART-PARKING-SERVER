import express from 'express';
import userController from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
const { register, login, logout, verifyToken } = userController;

/**
 * @route   POST /api/users/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/users/login
 * @desc    Authenticate user & get tokens
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/users/logout
 * @desc    Logout user & invalidate refresh token
 * @access  Private
 */
router.post('/logout', authenticate, logout);

/**
 * @route   POST /api/users/verify
 * @desc    Verify access token
 * @access  Public
 */
router.post('/verify', verifyToken);

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', authenticate, (req, res) => {
  res.status(200).json({
    status: 'Success',
    message: 'User profile retrieved successfully',
    user: req.user
  });
});

/**
 * @route   GET /api/users/admin
 * @desc    Admin only route
 * @access  Private/Admin
 */
router.get('/admin', authenticate, authorize(['ADMIN']), (req, res) => {
  res.status(200).json({
    status: 'Success',
    message: 'Admin access granted',
    user: req.user
  });
});

export default router;
