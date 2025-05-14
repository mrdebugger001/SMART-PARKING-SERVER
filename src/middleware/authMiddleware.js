import { verifyAccessToken } from '../config/jwt.js';

/**
 * Authentication middleware to protect routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const authenticate = async (req, res, next) => {
  console.log('🔒 Authentication middleware triggered'.cyan);
  
  try {
    // Extract token from Authorization header or request body
    const token = req.headers.authorization?.split(' ')[1] || 
                  req.body.token || 
                  req.query.token || 
                  req.headers['x-access-token'];
    
    // Check if token exists
    if (!token) {
      console.log('❌ Authentication failed: No token provided'.red);
      return res.status(401).json({ 
        status: 'Error', 
        error: 'Authentication required. No token provided.' 
      });
    }
    
    // Verify token
    console.log('🔍 Verifying access token...'.cyan);
    const decoded = verifyAccessToken(token);
    
    // Add user info to request
    req.user = {
      id: decoded.id,
      role: decoded.role,
      name: decoded.name
    };
    
    console.log(`✅ User authenticated: ${req.user.id} (${req.user.role})`.green);
    next();
    
  } catch (error) {
    console.error(`❌ Authentication failed: ${error.name}`.red);
    
    // Handle different token errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        status: 'Error', 
        error: 'Token expired' 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        status: 'Error', 
        error: 'Invalid token' 
      });
    }
    
    return res.status(401).json({ 
      status: 'Error', 
      error: 'Authentication failed' 
    });
  }
};

/**
 * Role-based authorization middleware
 * @param {String[]} roles - Array of allowed roles
 * @returns {Function} Express middleware function
 */
export const authorize = (roles = []) => {
  // Convert string to array if only one role provided
  if (typeof roles === 'string') {
    roles = [roles];
  }
  
  return (req, res, next) => {
    console.log(`🔒 Authorization check for roles: [${roles.join(', ')}]`.cyan);
    
    // Check if user exists in request
    if (!req.user) {
      console.log('❌ Authorization failed: User not authenticated'.red);
      return res.status(401).json({ 
        status: 'Error', 
        error: 'Authentication required before authorization' 
      });
    }
    
    // Check if user role is in allowed roles
    if (roles.length && !roles.includes(req.user.role)) {
      console.log(`❌ Authorization failed: User role ${req.user.role} not in ${roles}`.red);
      return res.status(403).json({ 
        status: 'Error', 
        error: 'You do not have permission to access this resource' 
      });
    }
    
    console.log(`✅ User authorized with role: ${req.user.role}`.green);
    next();
  };
}; 