import AuthService from '../services/authService.js';
import { User } from '../models/index.js';

/**
 * Middleware to verify JWT token and authenticate user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'Access token is required'
        }
      });
    }

    // Verify token
    const decoded = AuthService.verifyToken(token);
    
    // Get fresh user data from database
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User associated with token not found'
        }
      });
    }

    // Add user info to request object (without password)
    const { password, ...userWithoutPassword } = user.toJSON();
    req.user = userWithoutPassword;
    req.token = decoded;

    next();
  } catch (error) {
    let errorCode = 'TOKEN_ERROR';
    let errorMessage = 'Invalid or expired token';

    if (error.message === 'Token has expired') {
      errorCode = 'TOKEN_EXPIRED';
      errorMessage = 'Token has expired';
    } else if (error.message === 'Invalid token') {
      errorCode = 'INVALID_TOKEN';
      errorMessage = 'Invalid token format';
    }

    return res.status(401).json({
      success: false,
      error: {
        code: errorCode,
        message: errorMessage
      }
    });
  }
};

/**
 * Middleware to check if user has required role(s)
 * @param {...string} allowedRoles - Roles that are allowed to access the route
 * @returns {Function} Express middleware function
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user is authenticated (should be called after authenticateToken)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'User must be authenticated to access this resource'
        }
      });
    }

    // Check if user has required role
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}`
        }
      });
    }

    next();
  };
};

/**
 * Middleware for admin-only routes
 */
export const requireAdmin = requireRole('ADMIN');

/**
 * Middleware for admin and staff routes
 */
export const requireAdminOrStaff = requireRole('ADMIN', 'STAFF');

/**
 * Middleware for all authenticated users (any role)
 */
export const requireAuth = requireRole('ADMIN', 'STAFF', 'AUDITOR');

/**
 * Middleware for auditor and admin routes (read-only access)
 */
export const requireAuditorOrAdmin = requireRole('ADMIN', 'AUDITOR');

/**
 * Optional authentication middleware - adds user info if token is present but doesn't require it
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (token) {
      try {
        const decoded = AuthService.verifyToken(token);
        const user = await User.findByPk(decoded.userId);
        
        if (user) {
          const { password, ...userWithoutPassword } = user.toJSON();
          req.user = userWithoutPassword;
          req.token = decoded;
        }
      } catch (error) {
        // Ignore token errors for optional auth
        console.log('Optional auth token error:', error.message);
      }
    }

    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

/**
 * Middleware to check if user can access their own resources or is admin
 * @param {string} userIdParam - Name of the parameter containing user ID (default: 'userId')
 * @returns {Function} Express middleware function
 */
export const requireOwnershipOrAdmin = (userIdParam = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'Authentication required'
        }
      });
    }

    const targetUserId = req.params[userIdParam] || req.body[userIdParam];
    
    // Admin can access any resource
    if (req.user.role === 'ADMIN') {
      return next();
    }

    // User can only access their own resources
    if (req.user.id === targetUserId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: {
        code: 'ACCESS_DENIED',
        message: 'You can only access your own resources'
      }
    });
  };
};

/**
 * Rate limiting middleware (basic implementation)
 * @param {number} maxRequests - Maximum requests per window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Function} Express middleware function
 */
export const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    for (const [id, timestamps] of requests.entries()) {
      const validTimestamps = timestamps.filter(time => time > windowStart);
      if (validTimestamps.length === 0) {
        requests.delete(id);
      } else {
        requests.set(id, validTimestamps);
      }
    }

    // Check current client
    const clientRequests = requests.get(clientId) || [];
    const validRequests = clientRequests.filter(time => time > windowStart);

    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many requests. Maximum ${maxRequests} requests per ${windowMs / 1000} seconds.`
        }
      });
    }

    // Add current request
    validRequests.push(now);
    requests.set(clientId, validRequests);

    next();
  };
};