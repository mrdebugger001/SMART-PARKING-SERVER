import User from '../model/users/authModel.js';
import {generateAccessToken,generateRefreshToken} from '../config/jwt.js';
import Token from '../model/auth/token_model.js';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
  try {
      const { fullname, email, password, role } = req.body;

      // Validate required fields
      if (!fullname) {
          return res.status(400).json({ status: 'Error', error: 'Full Name is required.' });
      }
      if (!email) {
          return res.status(400).json({ status: 'Error', error: 'Email is required.' });
      }
      if (!password) {
          return res.status(400).json({ status: 'Error', error: 'Password is required.' });
      }
      if (!role) {
          return res.status(400).json({ status: 'Error', error: 'Role is required.' });
      }

      // Check for existing user
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
          return res.status(400).json({
              status: 'Error',
              error: 'This email already exists. Try logging in with this email'
          });
      }

      // Create user document without addresses
      const userData = {
          fullname,
          email: email.toLowerCase(),
          password,
          role
      };

      // Only add addresses field if addresses are provided
      if (req.body.addresses && Array.isArray(req.body.addresses) && req.body.addresses.length > 0) {
          userData.addresses = req.body.addresses;
      }

      const user = await User.create(userData);

      res.status(201).json({
          status: 'Success',
          user: {
              id: user._id,
              fullname: user.fullname,
              email: user.email,
              role: user.role
          },
          created: true
      });

  } catch (err) {
      console.error('Registration error:', err);
      res.status(400).json({
          status: 'Error',
          error: 'Error in registration process',
          created: false
      });
  }
};





export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Use the userSchema's static method to handle login logic
    const user = await User.login(email, password);

    // If user found and password is correct, generate tokens
    const accessToken = generateAccessToken(user._id,user.role,user.fullname);
    const refreshToken = generateRefreshToken(user._id, user.role);

    // Delete any existing refresh token for this user
    await Token.deleteOne({ userId: user._id });

    // Store the new refresh token in the database
    await Token.create({ userId: user._id, refreshToken });

    // Send the response with the tokens
    res.status(200).json({
      user: {
        id: user.id,
        role: user.role,
        fullname: user.fullname,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    // Handle errors (incorrect email/password)
    res.status(400).json({ message: err.message });
  }
};


export const logout = async (req, res) => {
  const { refreshToken } = req.body;

  // Check if the refresh token is provided
  if (!refreshToken) {
    return res.status(401).json({ status: 'Error', error: 'Refresh Token is required.' });
  }

  try {
    // Optionally: Remove the refresh token from the database
    const deletedToken = await Token.deleteOne({ refreshToken });

    if (deletedToken.deletedCount === 0) {
      return res.status(403).json({ message: 'Refresh token not found or already invalidated.' });
    }

    // Send success response
    res.status(200).json({ message: 'Logged out successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'Error', error: 'An error occurred while logging out.' });
  }
};


export const verifyToken = async (req, res) => {
  const accessToken = req.body.accessToken || 
                      req.query.accessToken || 
                      req.headers['x-access-token'];

  // Check if token is provided
  if (!accessToken) {
    return res.status(403).json({ 
      status: 'Error', 
      error: 'No access token provided' 
    });
  }

  try {
    // Log the secret key to ensure it's correctly set
    console.log('ACCESS_TOKEN_SECRET:', process.env.JWT_SECRET_KEY);

    // Verify the token using the access token secret
    const decoded = jwt.verify(
      accessToken, 
      process.env.JWT_SECRET_KEY // Ensure this matches your token generation secret
    );

    // If token is valid, return the decoded information
    res.status(200).json({
      status: 'Success',
      user: {
        id: decoded.id,
        role: decoded.role,
        fullname: decoded.fullname
      },
      tokenValid: true
    });

  } catch (error) {
    // Comprehensive error logging
    console.error('Token Verification Error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    // Detailed error handling
    switch (error.name) {
      case 'TokenExpiredError':
        return res.status(401).json({ 
          status: 'Error', 
          error: 'Access token has expired',
          details: error.message,
          tokenValid: false
        });

      case 'JsonWebTokenError':
        return res.status(401).json({ 
          status: 'Error', 
          error: 'Invalid access token',
          details: error.message,
          tokenValid: false
        });

      case 'NotBeforeError':
        return res.status(401).json({ 
          status: 'Error', 
          error: 'Token not yet active',
          details: error.message,
          tokenValid: false
        });

      default:
        // Log the full error for debugging
        console.error('Unexpected verification error:', error);
        
        res.status(500).json({ 
          status: 'Error', 
          error: 'Token verification failed',
          details: error.message,
          tokenValid: false
        });
    }
  }
};