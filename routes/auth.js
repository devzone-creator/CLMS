import express from 'express';
import AuthController from '../controllers/authController.js';
import { authenticateToken, requireAdmin } from '../middlewares/auth.js';
import { validateRegistration, validateLogin, validateChangePassword } from '../middlewares/validation.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (Admin only)
 * @access  Private (Admin only)
 */
router.post('/register', 
  authenticateToken, 
  requireAdmin, 
  validateRegistration, 
  AuthController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    User login
 * @access  Public
 */
router.post('/login', 
  validateLogin, 
  AuthController.login
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh JWT token
 * @access  Private
 */
router.post('/refresh', 
  authenticateToken, 
  AuthController.refreshToken
);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', 
  authenticateToken, 
  AuthController.getProfile
);

/**
 * @route   POST /api/auth/logout
 * @desc    User logout (client-side token removal)
 * @access  Private
 */
router.post('/logout', 
  authenticateToken, 
  AuthController.logout
);

/**
 * @route   POST /api/auth/validate-password
 * @desc    Validate password strength
 * @access  Public
 */
router.post('/validate-password', 
  AuthController.validatePassword
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', 
  authenticateToken, 
  validateChangePassword, 
  AuthController.changePassword
);

export default router;