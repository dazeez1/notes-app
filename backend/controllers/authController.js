const User = require('../models/User');
const { generateAuthToken } = require('../middleware/authMiddleware');
const emailService = require('../utils/emailService');
const { validationResult } = require('express-validator');

/**
 * Authentication Controller
 * Handles user registration, login, and email verification
 */
class AuthController {
  /**
   * Register a new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async registerUser(req, res) {
    try {
      // Check for validation errors
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors.array().map(error => ({
            field: error.path,
            message: error.msg,
            value: error.value
          }))
        });
      }

      const { fullName, emailAddress, phoneNumber, password } = req.body;

      // Check if user already exists with this email
      const existingUserByEmail = await User.findByEmail(emailAddress);
      if (existingUserByEmail) {
        return res.status(409).json({
          success: false,
          message: 'User with this email address already exists',
          error: 'EMAIL_ALREADY_EXISTS'
        });
      }

      // Check if user already exists with this phone number
      const existingUserByPhone = await User.findByPhone(phoneNumber);
      if (existingUserByPhone) {
        return res.status(409).json({
          success: false,
          message: 'User with this phone number already exists',
          error: 'PHONE_ALREADY_EXISTS'
        });
      }

      // Create new user
      const newUser = new User({
        fullName: fullName.trim(),
        emailAddress: emailAddress.toLowerCase().trim(),
        phoneNumber: phoneNumber.trim(),
        passwordHash: password
      });

      // Generate OTP for email verification
      const otpCode = newUser.generateEmailOtp();

      // Save user to database
      await newUser.save();

      // Send OTP email
      const emailSent = await emailService.sendOtpEmail(
        newUser.emailAddress,
        newUser.fullName,
        otpCode
      );

      // Prepare response data
      const userData = {
        id: newUser._id,
        fullName: newUser.fullName,
        emailAddress: newUser.emailAddress,
        phoneNumber: newUser.phoneNumber,
        isEmailVerified: newUser.isEmailVerified,
        accountCreatedAt: newUser.accountCreatedAt
      };

      res.status(201).json({
        success: true,
        message: 'User registered successfully. Please check your email for verification code.',
        data: {
          user: userData,
          emailSent: emailSent,
          requiresEmailVerification: true
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during registration',
        error: 'REGISTRATION_FAILED'
      });
    }
  }

  /**
   * Verify email OTP and activate user account
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async verifyEmailOtp(req, res) {
    try {
      // Check for validation errors
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors.array().map(error => ({
            field: error.path,
            message: error.msg,
            value: error.value
          }))
        });
      }

      const { emailAddress, otpCode } = req.body;

      // Find user by email
      const user = await User.findByEmail(emailAddress).select('+emailVerificationOtp +otpExpirationTime');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND'
        });
      }

      // Check if email is already verified
      if (user.isEmailVerified) {
        return res.status(400).json({
          success: false,
          message: 'Email is already verified',
          error: 'EMAIL_ALREADY_VERIFIED'
        });
      }

      // Verify OTP
      const isOtpValid = user.verifyEmailOtp(otpCode);
      if (!isOtpValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP code',
          error: 'INVALID_OTP'
        });
      }

      // Mark email as verified
      user.markEmailAsVerified();
      await user.save();

      // Generate JWT token
      const authToken = generateAuthToken(user);

      // Send welcome email
      await emailService.sendWelcomeEmail(user.emailAddress, user.fullName);

      // Prepare response data
      const userData = {
        id: user._id,
        fullName: user.fullName,
        emailAddress: user.emailAddress,
        phoneNumber: user.phoneNumber,
        isEmailVerified: user.isEmailVerified,
        accountCreatedAt: user.accountCreatedAt
      };

      res.status(200).json({
        success: true,
        message: 'Email verified successfully. Welcome to Notes App!',
        data: {
          user: userData,
          authToken: authToken,
          tokenType: 'Bearer'
        }
      });

    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during email verification',
        error: 'VERIFICATION_FAILED'
      });
    }
  }

  /**
   * Login user with email and password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async loginUser(req, res) {
    try {
      // Check for validation errors
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors.array().map(error => ({
            field: error.path,
            message: error.msg,
            value: error.value
          }))
        });
      }

      const { emailAddress, password } = req.body;

      // Find user by email and include password for comparison
      const user = await User.findByEmail(emailAddress).select('+passwordHash');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
          error: 'INVALID_CREDENTIALS'
        });
      }

      // Check if account is active
      if (!user.isAccountActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated. Please contact support.',
          error: 'ACCOUNT_DEACTIVATED'
        });
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
          error: 'INVALID_CREDENTIALS'
        });
      }

      // Update last login time
      user.lastLoginAt = new Date();
      await user.save();

      // Generate JWT token
      const authToken = generateAuthToken(user);

      // Prepare response data
      const userData = {
        id: user._id,
        fullName: user.fullName,
        emailAddress: user.emailAddress,
        phoneNumber: user.phoneNumber,
        isEmailVerified: user.isEmailVerified,
        accountCreatedAt: user.accountCreatedAt,
        lastLoginAt: user.lastLoginAt
      };

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: userData,
          authToken: authToken,
          tokenType: 'Bearer'
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during login',
        error: 'LOGIN_FAILED'
      });
    }
  }

  /**
   * Resend OTP for email verification
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async resendOtp(req, res) {
    try {
      // Check for validation errors
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors.array().map(error => ({
            field: error.path,
            message: error.msg,
            value: error.value
          }))
        });
      }

      const { emailAddress } = req.body;

      // Find user by email
      const user = await User.findByEmail(emailAddress);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND'
        });
      }

      // Check if email is already verified
      if (user.isEmailVerified) {
        return res.status(400).json({
          success: false,
          message: 'Email is already verified',
          error: 'EMAIL_ALREADY_VERIFIED'
        });
      }

      // Generate new OTP
      const otpCode = user.generateEmailOtp();
      await user.save();

      // Send OTP email
      const emailSent = await emailService.sendOtpEmail(
        user.emailAddress,
        user.fullName,
        otpCode
      );

      res.status(200).json({
        success: true,
        message: 'OTP code resent successfully. Please check your email.',
        data: {
          emailSent: emailSent
        }
      });

    } catch (error) {
      console.error('Resend OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while resending OTP',
        error: 'RESEND_OTP_FAILED'
      });
    }
  }

  /**
   * Get current user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCurrentUser(req, res) {
    try {
      // User information is already attached by auth middleware
      const userData = {
        id: req.user.id,
        fullName: req.user.fullName,
        emailAddress: req.user.emailAddress,
        phoneNumber: req.user.phoneNumber,
        isEmailVerified: req.user.isEmailVerified,
        accountCreatedAt: req.user.accountCreatedAt
      };

      res.status(200).json({
        success: true,
        message: 'User profile retrieved successfully',
        data: {
          user: userData
        }
      });

    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving user profile',
        error: 'PROFILE_RETRIEVAL_FAILED'
      });
    }
  }
}

// Create and export controller instance
const authController = new AuthController();

module.exports = authController;
