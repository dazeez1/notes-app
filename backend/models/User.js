const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

/**
 * User Schema for authentication and user management
 * Includes comprehensive validation and security features
 */
const userSchema = new mongoose.Schema({
  // Personal Information
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Full name must be at least 2 characters long'],
    maxlength: [50, 'Full name cannot exceed 50 characters'],
    validate: {
      validator: function(value) {
        // Allow letters, spaces, hyphens, and apostrophes
        return /^[a-zA-Z\s\-']+$/.test(value);
      },
      message: 'Full name can only contain letters, spaces, hyphens, and apostrophes'
    }
  },

  // Contact Information
  emailAddress: {
    type: String,
    required: [true, 'Email address is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: validator.isEmail,
      message: 'Please provide a valid email address'
    }
  },

  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
    validate: {
      validator: function(value) {
        // Support various phone number formats
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''));
      },
      message: 'Please provide a valid phone number'
    }
  },

  // Authentication
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't include password in queries by default
  },

  // Account Status
  isEmailVerified: {
    type: Boolean,
    default: false
  },

  isAccountActive: {
    type: Boolean,
    default: true
  },

  // OTP for email verification
  emailVerificationOtp: {
    type: String,
    select: false
  },

  otpExpirationTime: {
    type: Date,
    select: false
  },

  // Timestamps
  lastLoginAt: {
    type: Date
  },

  accountCreatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { 
    transform: function(doc, ret) {
      // Remove sensitive fields from JSON output
      delete ret.passwordHash;
      delete ret.emailVerificationOtp;
      delete ret.otpExpirationTime;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { 
    transform: function(doc, ret) {
      // Remove sensitive fields from object output
      delete ret.passwordHash;
      delete ret.emailVerificationOtp;
      delete ret.otpExpirationTime;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better query performance
userSchema.index({ emailAddress: 1 });
userSchema.index({ phoneNumber: 1 });
userSchema.index({ isAccountActive: 1 });

/**
 * Pre-save middleware to hash password before saving
 */
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('passwordHash')) return next();

  try {
    // Hash password with cost of 12
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    this.passwordHash = await bcrypt.hash(this.passwordHash, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Instance method to check if provided password matches the hashed password
 * @param {string} candidatePassword - The password to check
 * @returns {Promise<boolean>} - True if password matches
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.passwordHash);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

/**
 * Instance method to generate a random OTP for email verification
 * @returns {string} - 6-digit OTP
 */
userSchema.methods.generateEmailOtp = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.emailVerificationOtp = otp;
  this.otpExpirationTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return otp;
};

/**
 * Instance method to verify email OTP
 * @param {string} providedOtp - The OTP to verify
 * @returns {boolean} - True if OTP is valid
 */
userSchema.methods.verifyEmailOtp = function(providedOtp) {
  if (!this.emailVerificationOtp || !this.otpExpirationTime) {
    return false;
  }

  if (new Date() > this.otpExpirationTime) {
    return false; // OTP expired
  }

  return this.emailVerificationOtp === providedOtp;
};

/**
 * Instance method to mark email as verified
 */
userSchema.methods.markEmailAsVerified = function() {
  this.isEmailVerified = true;
  this.emailVerificationOtp = undefined;
  this.otpExpirationTime = undefined;
};

/**
 * Static method to find user by email
 * @param {string} email - Email address to search for
 * @returns {Promise<Object>} - User document
 */
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ emailAddress: email.toLowerCase() });
};

/**
 * Static method to find user by phone number
 * @param {string} phone - Phone number to search for
 * @returns {Promise<Object>} - User document
 */
userSchema.statics.findByPhone = function(phone) {
  return this.findOne({ phoneNumber: phone });
};

/**
 * Static method to find active users only
 * @returns {Promise<Array>} - Array of active user documents
 */
userSchema.statics.findActiveUsers = function() {
  return this.find({ isAccountActive: true });
};

// Create and export the User model
const User = mongoose.model('User', userSchema);

module.exports = User;
