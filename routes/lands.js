import express from 'express';
import LandController from '../controllers/landController.js';
import { authenticateToken, requireAdminOrStaff, requireAuth } from '../middlewares/auth.js';
import { validateLandPlot } from '../middlewares/validation.js';

const router = express.Router();

/**
 * @route   GET /api/lands/statistics
 * @desc    Get land plot statistics
 * @access  Private (All authenticated users)
 */
router.get('/statistics', 
  authenticateToken, 
  requireAuth, 
  LandController.getStatistics
);

/**
 * @route   GET /api/lands/available
 * @desc    Get available land plots
 * @access  Private (All authenticated users)
 */
router.get('/available', 
  authenticateToken, 
  requireAuth, 
  LandController.getAvailableLandPlots
);

/**
 * @route   POST /api/lands
 * @desc    Create a new land plot
 * @access  Private (Admin and Staff only)
 */
router.post('/', 
  authenticateToken, 
  requireAdminOrStaff, 
  validateLandPlot, 
  LandController.createLandPlot
);

/**
 * @route   GET /api/lands
 * @desc    Get all land plots with filtering and pagination
 * @access  Private (All authenticated users)
 */
router.get('/', 
  authenticateToken, 
  requireAuth, 
  LandController.getAllLandPlots
);

/**
 * @route   GET /api/lands/:id
 * @desc    Get land plot by ID
 * @access  Private (All authenticated users)
 */
router.get('/:id', 
  authenticateToken, 
  requireAuth, 
  LandController.getLandPlotById
);

/**
 * @route   PUT /api/lands/:id
 * @desc    Update land plot
 * @access  Private (Admin and Staff only)
 */
router.put('/:id', 
  authenticateToken, 
  requireAdminOrStaff, 
  validateLandPlot, 
  LandController.updateLandPlot
);

/**
 * @route   PATCH /api/lands/:id/mark-sold
 * @desc    Mark land plot as sold
 * @access  Private (Admin and Staff only)
 */
router.patch('/:id/mark-sold', 
  authenticateToken, 
  requireAdminOrStaff, 
  LandController.markAsSold
);

export default router;