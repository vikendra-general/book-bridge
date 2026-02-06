const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const jwt = require('jsonwebtoken');
const { sendVerificationCode } = require('../utils/emailService');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { username, email, password, age, phoneNumber } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email, and password'
      });
    }

    // Check if email already exists (one email = one user only)
    const emailExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists. Please use a different email or login.'
      });
    }

    // Check if username already exists
    const usernameExists = await User.findOne({ username: username.trim() });
    if (usernameExists) {
      return res.status(400).json({
        success: false,
        message: 'Username is already taken. Please choose a different username.'
      });
    }

    // Normalize phone number to Indian standard format
    let normalizedPhoneNumber = phoneNumber;
    if (phoneNumber) {
      // Remove all non-digit characters except + at the start
      const digitsOnly = phoneNumber.replace(/[^\d+]/g, '');
      
      if (digitsOnly.startsWith('+91')) {
        // Format: +91XXXXXXXXXX (13 characters total)
        normalizedPhoneNumber = '+91' + digitsOnly.slice(3).replace(/\D/g, '').slice(0, 10);
      } else if (digitsOnly.startsWith('0')) {
        // Format: 0XXXXXXXXXX (11 characters) - convert to +91XXXXXXXXXX
        normalizedPhoneNumber = '+91' + digitsOnly.slice(1).replace(/\D/g, '').slice(0, 10);
      } else {
        // Format: XXXXXXXXXX (10 digits) - add +91 prefix
        const tenDigits = digitsOnly.replace(/\D/g, '').slice(0, 10);
        if (tenDigits.length === 10) {
          normalizedPhoneNumber = '+91' + tenDigits;
        } else {
          // Keep original if validation fails
          normalizedPhoneNumber = phoneNumber;
        }
      }
    }

    // Create user
    const user = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password,
      age,
      phoneNumber: normalizedPhoneNumber
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        age: user.age,
        phoneNumber: user.phoneNumber
      }
    });
  } catch (error) {
    // Handle MongoDB duplicate key error (unique constraint violation)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const fieldName = field === 'email' ? 'email' : 'username';
      return res.status(400).json({
        success: false,
        message: `An account with this ${fieldName} already exists. Please use a different ${fieldName} or login.`
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed. Please try again.'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been blocked. Please contact customer support.'
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        age: user.age,
        phoneNumber: user.phoneNumber
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Generate 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Request password reset - Send verification code
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email address'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a verification code has been sent.'
      });
    }

    // Generate 6-digit code
    const code = generateVerificationCode();

    // Clean up old codes for this email
    await PasswordReset.cleanupOldCodes(user.email);

    // Save verification code
    const passwordReset = await PasswordReset.create({
      email: user.email,
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    // Send verification code via email
    try {
      await sendVerificationCode(user.email, code);
      
      res.status(200).json({
        success: true,
        message: 'Verification code has been sent to your email. Please check your inbox.'
      });
    } catch (emailError) {
      // Delete the code if email fails
      await PasswordReset.findByIdAndDelete(passwordReset._id);
      
      console.error('Email sending failed:', emailError.message);
      
      // Provide user-friendly error message
      let errorMessage = 'Failed to send verification code. ';
      if (emailError.message.includes('authentication failed') || emailError.message.includes('App Password')) {
        errorMessage += 'Email service is not properly configured. Please contact support.';
      } else {
        errorMessage += 'Please try again later or contact support.';
      }
      
      return res.status(500).json({
        success: false,
        message: errorMessage
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Something went wrong. Please try again.'
    });
  }
};

// @desc    Verify reset code
// @route   POST /api/auth/verify-reset-code
// @access  Public
exports.verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and verification code'
      });
    }

    // Find the reset code
    const passwordReset = await PasswordReset.findOne({
      email: email.toLowerCase().trim(),
      code,
      verified: false,
      expiresAt: { $gt: new Date() } // Not expired
    });

    if (!passwordReset) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code'
      });
    }

    // Mark as verified
    passwordReset.verified = true;
    await passwordReset.save();

    res.status(200).json({
      success: true,
      message: 'Verification code verified successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Verification failed. Please try again.'
    });
  }
};

// @desc    Reset password with verified code
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, verification code, and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Verify the code is valid and verified
    const passwordReset = await PasswordReset.findOne({
      email: email.toLowerCase().trim(),
      code,
      verified: true,
      expiresAt: { $gt: new Date() }
    });

    if (!passwordReset) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code. Please request a new code.'
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Delete all reset codes for this email
    await PasswordReset.deleteMany({ email: user.email });

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Password reset failed. Please try again.'
    });
  }
};
