const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware to protect routes
 * Verifies JWT token and attaches user information to request object
 */

/**
 * Middleware to verify JWT token from Authorization header
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) // Remove 'Bearer ' prefix
      : null;

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        error: 'MISSING_TOKEN'
      });
    }

    // Verify the token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by ID from token
    const user = await User.findById(decodedToken.userId).select('+passwordHash');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.',
        error: 'INVALID_TOKEN'
      });
    }

    // Check if user account is active
    if (!user.isAccountActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
        error: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Attach user information to request object
    req.user = {
      id: user._id,
      emailAddress: user.emailAddress,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      isEmailVerified: user.isEmailVerified,
      accountCreatedAt: user.accountCreatedAt
    };

    next();
  } catch (error) {
    // Handle different JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format.',
        error: 'INVALID_TOKEN_FORMAT'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.',
        error: 'TOKEN_EXPIRED'
      });
    }

    // Handle other errors
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
      error: 'AUTHENTICATION_ERROR'
    });
  }
};

/**
 * Middleware to check if user's email is verified
 * Should be used after authenticateToken middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
      error: 'AUTHENTICATION_REQUIRED'
    });
  }

  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required. Please verify your email address.',
      error: 'EMAIL_NOT_VERIFIED'
    });
  }

  next();
};

/**
 * Middleware to generate JWT token for user
 * @param {Object} user - User object
 * @returns {string} - JWT token
 */
const generateAuthToken = (user) => {
  const payload = {
    userId: user._id,
    emailAddress: user.emailAddress,
    isEmailVerified: user.isEmailVerified
  };

  const options = {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: 'notes-app-api',
    audience: 'notes-app-client'
  };

  return jwt.sign(payload, process.env.JWT_SECRET, options);
};

/**
 * Middleware to verify token and get user info without requiring authentication
 * Useful for optional authentication scenarios
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuthentication = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7)
      : null;

    if (token) {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decodedToken.userId);
      
      if (user && user.isAccountActive) {
        req.user = {
          id: user._id,
          emailAddress: user.emailAddress,
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          isEmailVerified: user.isEmailVerified,
          accountCreatedAt: user.accountCreatedAt
        };
      }
    }
    
    next();
  } catch (error) {
    // For optional auth, we don't fail on token errors
    next();
  }
};

/**
 * Middleware to check if user has specific role (for future role-based access)
 * @param {string} requiredRole - Required role for access
 * @returns {Function} - Middleware function
 */
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        error: 'AUTHENTICATION_REQUIRED'
      });
    }

    // For now, all users have the same role
    // This can be extended when role system is implemented
    if (requiredRole !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions.',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requireEmailVerification,
  generateAuthToken,
  optionalAuthentication,
  requireRole
};
