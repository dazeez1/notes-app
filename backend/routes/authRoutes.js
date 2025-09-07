const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Validation rules for user registration
 */
const registerValidationRules = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Full name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s\-']+$/)
    .withMessage('Full name can only contain letters, spaces, hyphens, and apostrophes'),

  body('emailAddress')
    .trim()
    .notEmpty()
    .withMessage('Email address is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .toLowerCase(),

  body('phoneNumber')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

/**
 * Validation rules for email OTP verification
 */
const verifyOtpValidationRules = [
  body('emailAddress')
    .trim()
    .notEmpty()
    .withMessage('Email address is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .toLowerCase(),

  body('otpCode')
    .trim()
    .notEmpty()
    .withMessage('OTP code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP code must be exactly 6 digits')
    .isNumeric()
    .withMessage('OTP code must contain only numbers')
];

/**
 * Validation rules for user login
 */
const loginValidationRules = [
  body('emailAddress')
    .trim()
    .notEmpty()
    .withMessage('Email address is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .toLowerCase(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

/**
 * Validation rules for resending OTP
 */
const resendOtpValidationRules = [
  body('emailAddress')
    .trim()
    .notEmpty()
    .withMessage('Email address is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .toLowerCase()
];

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public
 * @body    { fullName, emailAddress, phoneNumber, password }
 */
router.post('/signup', registerValidationRules, authController.registerUser);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify email OTP and activate account
 * @access  Public
 * @body    { emailAddress, otpCode }
 */
router.post('/verify-otp', verifyOtpValidationRules, authController.verifyEmailOtp);

/**
 * @route   POST /api/auth/login
 * @desc    Login user with email and password
 * @access  Public
 * @body    { emailAddress, password }
 */
router.post('/login', loginValidationRules, authController.loginUser);

/**
 * @route   POST /api/auth/resend-otp
 * @desc    Resend OTP for email verification
 * @access  Public
 * @body    { emailAddress }
 */
router.post('/resend-otp', resendOtpValidationRules, authController.resendOtp);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private (requires authentication)
 */
router.get('/me', authenticateToken, authController.getCurrentUser);

/**
 * @route   GET /api/auth/protected
 * @desc    Test protected route
 * @access  Private (requires authentication)
 */
router.get('/protected', authenticateToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'This is a protected route. Authentication successful!',
    data: {
      user: {
        id: req.user.id,
        fullName: req.user.fullName,
        emailAddress: req.user.emailAddress,
        isEmailVerified: req.user.isEmailVerified
      },
      timestamp: new Date().toISOString()
    }
  });
});

/**
 * @route   GET /api/auth/health
 * @desc    Health check for authentication service
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Authentication service is healthy',
    data: {
      service: 'notes-app-auth',
      status: 'operational',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
});

module.exports = router;
