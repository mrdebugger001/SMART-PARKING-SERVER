// utils/jwt.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Generate an access token for authenticated user
 * @param {string} userId - The user's ID
 * @param {string} role - The user's role (ADMIN, CLIENT)
 * @param {string} name - The user's full name
 * @returns {string} JWT access token
 */
export const generateAccessToken = (userId, role, name) => {
  // Verify the required environment variable is set
  if (!process.env.JWT_SECRET_KEY) {
    console.error('JWT_SECRET_KEY is not defined in environment variables');
    throw new Error('JWT configuration error');
  }

  // Set token expiration time (default to 15 minutes if not specified)
  const expiresIn = process.env.JWT_EXPIRES_IN || '15m';
  
  // Create payload with user information
  const payload = {
    id: userId,
    role: role,
    name: name
  };
  
  // Log token generation in development environment
  if (process.env.NODE_ENV === 'development') {
    console.log(`Generating access token for user ${userId} with role ${role}`);
  }
  
  // Generate and return the signed token
  return jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn });
};

/**
 * Generate a refresh token for maintaining user session
 * @param {string} userId - The user's ID
 * @param {string} role - The user's role
 * @returns {string} JWT refresh token
 */
export const generateRefreshToken = (userId, role) => {
  // Verify the required environment variable is set
  if (!process.env.JWT_REFRESH_KEY) {
    console.error('JWT_REFRESH_KEY is not defined in environment variables');
    throw new Error('JWT configuration error');
  }
  
  // Set refresh token expiration (default to 7 days if not specified)
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  
  // Create payload with minimal user information
  const payload = {
    id: userId,
    role: role
  };
  
  // Generate and return the signed refresh token
  return jwt.sign(payload, process.env.JWT_REFRESH_KEY, { expiresIn });
};

/**
 * Verify an access token
 * @param {string} token - The JWT token to verify
 * @returns {Object} Decoded token payload or throws error
 */
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch (error) {
    // Enhanced error logging
    console.error(`Token verification error: ${error.name} - ${error.message}`);
    throw error;
  }
};

/**
 * Verify a refresh token
 * @param {string} token - The refresh token to verify
 * @returns {Object} Decoded token payload or throws error
 */
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_KEY);
  } catch (error) {
    console.error(`Refresh token verification error: ${error.name} - ${error.message}`);
    throw error;
  }
};
