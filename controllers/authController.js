import AuthService from '../services/authService.js';
import { validationResult } from 'express-validator';

class AuthController {
  
  /**
   * Register a new user (Admin only)
   * POST /api/auth/register
   */
  static async register(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array()
          }
        });
      }

      const { email, password, role, firstName, lastName } = req.body;

      // Register user
      const user = await AuthService.register({
        email,
        password,
        role,
        firstName,
        lastName
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user
        }
      });

    } catch (error) {
      console.error('Registration error:', error);

      if (error.message.includes('User with this email already exists')) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'EMAIL_EXISTS',
            message: 'A user with this email already exists'
          }
        });
      }

      if (error.message.includes('Validation failed')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'REGISTRATION_ERROR',
          message: 'Failed to register user'
        }
      });
    }
  }

  /**
   * User login
   * POST /api/auth/login
   */
  static async login(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array()
          }
        });
      }

      const { email, password } = req.body;

      // Authenticate user
      const result = await AuthService.login(email, password);

      res.json({
        success: true,
        message: 'Login successful',
        data: result
      });

    } catch (error) {
      console.error('Login error:', error);

      if (error.message === 'Invalid email or password') {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'LOGIN_ERROR',
          message: 'Failed to authenticate user'
        }
      });
    }
  }

  /**
   * Refresh token
   * POST /api/auth/refresh
   */
  static async refreshToken(req, res) {
    try {
      // User should be authenticated (middleware adds req.user)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'NOT_AUTHENTICATED',
            message: 'Authentication required'
          }
        });
      }

      // Generate new token
      const result = await AuthService.refreshToken(req.user.id);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: result
      });

    } catch (error) {
      console.error('Token refresh error:', error);

      res.status(500).json({
        success: false,
        error: {
          code: 'TOKEN_REFRESH_ERROR',
          message: 'Failed to refresh token'
        }
      });
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/profile
   */
  static async getProfile(req, res) {
    try {
      // User should be authenticated (middleware adds req.user)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'NOT_AUTHENTICATED',
            message: 'Authentication required'
          }
        });
      }

      res.json({
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          user: req.user
        }
      });

    } catch (error) {
      console.error('Get profile error:', error);

      res.status(500).json({
        success: false,
        error: {
          code: 'PROFILE_ERROR',
          message: 'Failed to retrieve profile'
        }
      });
    }
  }

  /**
   * Logout (client-side token removal, server-side logging)
   * POST /api/auth/logout
   */
  static async logout(req, res) {
    try {
      // Log the logout action
      console.log(`User ${req.user?.email || 'unknown'} logged out at ${new Date().toISOString()}`);

      res.json({
        success: true,
        message: 'Logout successful'
      });

    } catch (error) {
      console.error('Logout error:', error);

      res.status(500).json({
        success: false,
        error: {
          code: 'LOGOUT_ERROR',
          message: 'Failed to logout'
        }
      });
    }
  }

  /**
   * Validate password strength
   * POST /api/auth/validate-password
   */
  static async validatePassword(req, res) {
    try {
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PASSWORD',
            message: 'Password is required'
          }
        });
      }

      const validation = AuthService.validatePassword(password);

      res.json({
        success: true,
        message: 'Password validation completed',
        data: validation
      });

    } catch (error) {
      console.error('Password validation error:', error);

      res.status(500).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Failed to validate password'
        }
      });
    }
  }

  /**
   * Change password
   * PUT /api/auth/change-password
   */
  static async changePassword(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array()
          }
        });
      }

      const { currentPassword, newPassword } = req.body;

      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'NOT_AUTHENTICATED',
            message: 'Authentication required'
          }
        });
      }

      // Verify current password
      const loginResult = await AuthService.login(req.user.email, currentPassword);
      
      // Update password (this will trigger the User model's beforeUpdate hook to hash the new password)
      const { User } = await import('../models/index.js');
      const user = await User.findByPk(req.user.id);
      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('Change password error:', error);

      if (error.message === 'Invalid email or password') {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CURRENT_PASSWORD',
            message: 'Current password is incorrect'
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'PASSWORD_CHANGE_ERROR',
          message: 'Failed to change password'
        }
      });
    }
  }
}

export default AuthController;