import { PrismaClient } from '../../generated/prisma-client/index.js';
import bcrypt from 'bcrypt';
import { generateAccessToken, generateRefreshToken, verifyAccessToken } from '../config/jwt.js';
import jwt from 'jsonwebtoken';
import colors from 'colors';

// Initialize Prisma client
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Debug Prisma models availability
console.log('\n🔍 DEBUGGING USER CONTROLLER PRISMA CLIENT:'.yellow);
console.log('================================='.gray);
console.log('Available Prisma models:'.cyan);
console.log(Object.keys(prisma).filter(key => !key.startsWith('_')).join(', ').green);
console.log('=================================\n'.gray);

/**
 * User registration endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Response with user data or error
 */
export const register = async (req, res) => {
  // Start tracking execution time for performance monitoring
  const startTime = Date.now();
  console.log('🔄 Starting user registration process...'.cyan);
  
  try {
    const { name, email, password, role } = req.body;
    
    // Validate required fields with detailed error messages
    if (!name) {
      console.log('❌ Registration failed: Name is required'.red);
      return res.status(400).json({ 
        status: 'Error', 
        error: 'Full name is required.' 
      });
    }
    
    if (!email) {
      console.log('❌ Registration failed: Email is required'.red);
      return res.status(400).json({ 
        status: 'Error', 
        error: 'Email is required.' 
      });
    }
    
    if (!password) {
      console.log('❌ Registration failed: Password is required'.red);
      return res.status(400).json({ 
        status: 'Error', 
        error: 'Password is required.' 
      });
    }
    
    if (!role) {
      console.log('❌ Registration failed: Role is required'.red);
      return res.status(400).json({ 
        status: 'Error', 
        error: 'Role is required.' 
      });
    }
    
    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase();
    console.log(`📧 Normalized email: ${normalizedEmail}`.cyan);
    
    // Check for existing user with the same email
    console.log(`🔍 Checking for existing user with email: ${normalizedEmail}`.cyan);
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });
    
    if (existingUser) {
      console.log(`❌ Registration failed: Email ${normalizedEmail} already exists`.red);
      return res.status(400).json({
        status: 'Error',
        error: 'This email already exists. Try logging in with this email'
      });
    }
    
    // Hash the password with appropriate cost factor
    console.log('🔐 Hashing password...'.cyan);
    const saltRounds = 15; // High cost factor for production
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Prepare user data
    const userData = {
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: role || 'CLIENT' // Default to CLIENT if role is not valid
    };
    
    // Create new user in database
    console.log('📝 Creating new user record...'.cyan);
    const newUser = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    
    // Calculate and log execution time
    const executionTime = Date.now() - startTime;
    console.log(`✅ User registration successful in ${executionTime}ms`.green);
    
    // Send success response with user data
    return res.status(201).json({
      status: 'Success',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      },
      created: true
    });
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`❌ Registration failed after ${executionTime}ms: ${error.message}`.red);
    
    // Provide detailed error logging in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error details:', error);
    }
    
    // Determine appropriate error response
    let statusCode = 400;
    let errorMessage = 'Error in registration process';
    
    // Customize error message based on error type
    if (error.code === 'P2002') {
      errorMessage = 'Email already exists';
    } else if (error.code === 'P2000') {
      errorMessage = 'Input value too long for field';
    }
    
    return res.status(statusCode).json({
      status: 'Error',
      error: errorMessage,
      created: false
    });
  }
};

/**
 * User login endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Response with user data and tokens or error
 */
export const login = async (req, res) => {
  const startTime = Date.now();
  console.log('\n🔄 STARTING USER LOGIN PROCESS'.yellow.bold);
  console.log('================================='.gray);
  
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      console.log('❌ Login failed: Email and password required'.red);
      return res.status(400).json({
        status: 'Error',
        error: 'Email and password are required'
      });
    }
    
    // Find user by email (case insensitive)
    console.log(`🔍 Finding user with email: ${email.toLowerCase()}`.cyan);
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { tokens: true } // Include tokens to access them directly
    });
    
    console.log(`📋 User object structure:`.cyan);
    console.log(JSON.stringify({
      id: user?.id,
      email: user?.email,
      name: user?.name,
      tokensCount: user?.tokens?.length || 0
    }, null, 2).green);
    
    // Check if user exists
    if (!user) {
      console.log('❌ Login failed: User not found'.red);
      return res.status(401).json({
        status: 'Error',
        error: 'Invalid email or password'
      });
    }
    
    // Verify password
    console.log('🔐 Verifying password...'.cyan);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log('❌ Login failed: Invalid password'.red);
      return res.status(401).json({
        status: 'Error',
        error: 'Invalid email or password'
      });
    }
    
    // Generate tokens
    console.log('🔑 Generating access and refresh tokens...'.cyan);
    const accessToken = generateAccessToken(user.id, user.role, user.name);
    const refreshToken = generateRefreshToken(user.id, user.role);
    
    // Calculate token expiry date for storage
    const refreshExpiryDays = 7; // Default to 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshExpiryDays);
    
    // Store refresh token info (IP, user agent, etc.)
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ipAddress = req.ip || req.socket.remoteAddress || 'Unknown';
    
    // Delete existing tokens directly through user relation
    console.log(`🧹 Attempting to delete existing tokens for user ${user.id}...`.cyan);
    if (user.tokens && user.tokens.length > 0) {
      console.log(`📊 Found ${user.tokens.length} existing tokens`.yellow);
      
      try {
        const result = await prisma.$transaction([
          prisma.token.deleteMany({
            where: { userId: user.id }
          })
        ]);
        console.log(`✅ Successfully deleted tokens: ${JSON.stringify(result)}`.green);
      } catch (error) {
        console.error(`❌ Error in transaction when deleting tokens: ${error.message}`.red);
      }
    } else {
      console.log(`ℹ️ No existing tokens found for user`.blue);
    }
    
    // Store new token
    console.log('💾 Storing new refresh token...'.cyan);
    try {
      // Debug transaction to create token
      console.log(`🔬 Token data to store:`.yellow);
      console.log(JSON.stringify({
        userId: user.id,
        accessToken: `${accessToken.substring(0, 10)}...`,
        refreshToken: `${refreshToken.substring(0, 10)}...`,
        expiresAt,
        userAgent: userAgent?.substring(0, 20) || 'Unknown',
        ipAddress
      }, null, 2).green);
      
      // Try multiple methods for storing the token
      console.log('📊 Trying multiple token storage methods...'.yellow);
      
      // Method 1: Regular create
      try {
        console.log('📝 Method 1: Using prisma.token.create()'.cyan);
        const createdToken = await prisma.token.create({
          data: {
            userId: user.id,
            accessToken,
            refreshToken,
            expiresAt,
            userAgent,
            ipAddress
          }
        });
        console.log('✅ Method 1 succeeded!'.green);
      } catch (err) {
        console.log(`⚠️ Method 1 failed: ${err.message}`.yellow);
        
        // Method 2: Transaction
        try {
          console.log('📝 Method 2: Using prisma.$transaction()'.cyan);
          const result = await prisma.$transaction([
            prisma.token.create({
              data: {
                userId: user.id,
                accessToken,
                refreshToken,
                expiresAt,
                userAgent,
                ipAddress
              }
            })
          ]);
          console.log('✅ Method 2 succeeded!'.green);
        } catch (err2) {
          console.log(`⚠️ Method 2 failed: ${err2.message}`.yellow);
          
          // Method 3: Direct SQL using executeRaw
          try {
            console.log('📝 Method 3: Using SQL directly'.cyan);
            const sql = `
              INSERT INTO "Token" ("userId", "accessToken", "refreshToken", "expiresAt", "userAgent", "ipAddress", "createdAt") 
              VALUES ($1, $2, $3, $4, $5, $6, NOW())
            `;
            await prisma.$executeRaw`
              INSERT INTO "Token" ("userId", "accessToken", "refreshToken", "expiresAt", "userAgent", "ipAddress", "createdAt")
              VALUES (${user.id}, ${accessToken}, ${refreshToken}, ${expiresAt}, ${userAgent}, ${ipAddress}, NOW())
            `;
            console.log('✅ Method 3 succeeded!'.green);
          } catch (err3) {
            console.log(`⚠️ Method 3 failed: ${err3.message}`.yellow);
            throw new Error('All token storage methods failed');
          }
        }
      }
    } catch (error) {
      console.error(`❌ All token storage methods failed: ${error.message}`.red);
      console.error(error.stack.red);
      
      // Continue anyway - we'll return the tokens even if storage fails
      console.log(`⚠️ Continuing without persistent token storage`.yellow);
    }
    
    // Log SQL for debugging
    console.log(`🧾 SQL debugging enabled for token operations`.magenta);
    
    // Calculate execution time
    const executionTime = Date.now() - startTime;
    console.log(`✅ Login successful in ${executionTime}ms`.green);
    console.log('=================================\n'.gray);
    
    // Send response with tokens
    return res.status(200).json({
      status: 'Success',
      user: {
        id: user.id,
        role: user.role,
        name: user.name
      },
      accessToken,
      refreshToken
    });
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`❌ Login failed after ${executionTime}ms: ${error.message}`.red.bold);
    console.error(`🔍 Error stack: ${error.stack}`.red);
    
    if (process.env.NODE_ENV === 'development') {
      console.error('Error details:'.yellow, error);
    }
    
    return res.status(400).json({ 
      status: 'Error',
      error: error.message || 'Login failed' 
    });
  }
};

/**
 * User logout endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Response indicating logout success or error
 */
export const logout = async (req, res) => {
  const startTime = Date.now();
  console.log('🔄 Starting user logout process...'.cyan);
  
  try {
    const { refreshToken } = req.body;
    
    // Check if refresh token is provided
    if (!refreshToken) {
      console.log('❌ Logout failed: Refresh token required'.red);
      return res.status(401).json({ 
        status: 'Error', 
        error: 'Refresh Token is required.' 
      });
    }
    
    try {
      // Find and delete the token
      console.log('🔍 Finding and deleting refresh token...'.cyan);
      const deletedToken = await prisma.token.deleteMany({
        where: { refreshToken }
      });
      
      // Check if token was found and deleted
      if (!deletedToken || deletedToken.count === 0) {
        console.log('⚠️ Logout: Token not found, but continuing...'.yellow);
        // We'll still consider this a successful logout
      }
    } catch (error) {
      console.log(`⚠️ Error during token deletion: ${error.message}`.yellow);
      // We'll still consider this a successful logout
    }
    
    // Calculate execution time
    const executionTime = Date.now() - startTime;
    console.log(`✅ Logout successful in ${executionTime}ms`.green);
    
    // Send success response
    return res.status(200).json({ 
      status: 'Success',
      message: 'Logged out successfully.' 
    });
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`❌ Logout failed after ${executionTime}ms: ${error.message}`.red);
    
    if (process.env.NODE_ENV === 'development') {
      console.error('Error details:', error);
    }
    
    return res.status(500).json({ 
      status: 'Error', 
      error: 'An error occurred while logging out.' 
    });
  }
};

/**
 * Verify user token endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Response with token verification result
 */
export const verifyToken = async (req, res) => {
  const startTime = Date.now();
  console.log('🔄 Starting token verification process...'.cyan);
  
  // Extract token from request
  const accessToken = req.body.accessToken || 
                      req.query.accessToken || 
                      req.headers['x-access-token'] ||
                      req.headers.authorization?.split(' ')[1];
  
  // Check if token is provided
  if (!accessToken) {
    console.log('❌ Verification failed: No token provided'.red);
    return res.status(403).json({ 
      status: 'Error', 
      error: 'No access token provided',
      tokenValid: false
    });
  }
  
  try {
    // Log environment check in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔑 Using JWT_SECRET_KEY: ${process.env.JWT_SECRET_KEY ? 'set' : 'not set'}`.yellow);
    }
    
    // Verify token
    console.log('🔍 Verifying access token...'.cyan);
    const decoded = verifyAccessToken(accessToken);
    
    // Validate the payload has expected properties
    if (!decoded || !decoded.id || !decoded.role) {
      console.log('❌ Verification failed: Invalid token payload'.red);
      return res.status(401).json({
        status: 'Error',
        error: 'Invalid token payload',
        tokenValid: false
      });
    }
    
    // Calculate execution time
    const executionTime = Date.now() - startTime;
    console.log(`✅ Token verification successful in ${executionTime}ms`.green);
    
    // Return decoded user info
    return res.status(200).json({
      status: 'Success',
      user: {
        id: decoded.id,
        role: decoded.role,
        name: decoded.name
      },
      tokenValid: true
    });
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`❌ Token verification failed after ${executionTime}ms: ${error.name}`.red);
    
    // Log detailed error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    
    // Handle specific JWT errors
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
        return res.status(500).json({ 
          status: 'Error', 
          error: 'Token verification failed',
          details: error.message,
          tokenValid: false
        });
    }
  }
};

// Either export nothing (since all functions are already exported with 'export const'),
// or if you want a default export:
export default { register, login, logout, verifyToken };