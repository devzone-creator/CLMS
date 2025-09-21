import { body } from 'express-validator';

// User registration validation
export const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
  
  body('role')
    .isIn(['ADMIN', 'STAFF', 'AUDITOR'])
    .withMessage('Role must be ADMIN, STAFF, or AUDITOR'),
  
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces')
];

// User login validation
export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Change password validation
export const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/\d/)
    .withMessage('New password must contain at least one number')
];

// Land plot validation
export const validateLandPlot = [
  body('plotNumber')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Plot number must be between 1 and 50 characters')
    .matches(/^[A-Z0-9-_]+$/i)
    .withMessage('Plot number can only contain letters, numbers, hyphens, and underscores'),
  
  body('location')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Location must be between 2 and 200 characters'),
  
  body('size')
    .isFloat({ min: 0.01 })
    .withMessage('Size must be a positive number greater than 0'),
  
  body('sizeUnit')
    .isIn(['ACRES', 'HECTARES', 'SQ_METERS'])
    .withMessage('Size unit must be ACRES, HECTARES, or SQ_METERS'),
  
  body('ownerName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Owner name must be between 2 and 100 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  
  body('status')
    .optional()
    .isIn(['AVAILABLE', 'SOLD', 'DISPUTED', 'RESERVED'])
    .withMessage('Status must be AVAILABLE, SOLD, DISPUTED, or RESERVED')
];

// Transaction validation
export const validateTransaction = [
  body('landPlotId')
    .isUUID()
    .withMessage('Land plot ID must be a valid UUID'),
  
  body('buyerName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Buyer name must be between 2 and 100 characters'),
  
  body('buyerContact')
    .trim()
    .isLength({ min: 10, max: 50 })
    .withMessage('Buyer contact must be between 10 and 50 characters'),
  
  body('sellerName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Seller name must be between 2 and 100 characters'),
  
  body('sellerContact')
    .trim()
    .isLength({ min: 10, max: 50 })
    .withMessage('Seller contact must be between 10 and 50 characters'),
  
  body('salePrice')
    .isFloat({ min: 0.01 })
    .withMessage('Sale price must be a positive number greater than 0'),
  
  body('commissionRate')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Commission rate must be between 0 and 1 (0% to 100%)'),
  
  body('transactionDate')
    .optional()
    .isISO8601()
    .withMessage('Transaction date must be a valid date')
];