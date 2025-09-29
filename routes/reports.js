import express from 'express';
import ReportsController from '../controllers/reportsController.js';
import { authenticateToken, requireAuditorOrAdmin } from '../middlewares/auth.js';

const router = express.Router();

// All report routes require authentication and appropriate permissions
router.use(authenticateToken);
router.use(requireAuditorOrAdmin); // Only ADMIN and AUDITOR can access reports

/**
 * @route   GET /reports/summary
 * @desc    Get business summary report
 * @access  Private (Admin, Auditor)
 * @query   startDate, endDate, userId
 */
router.get('/summary', ReportsController.getBusinessSummary);

/**
 * @route   GET /reports/transactions
 * @desc    Get detailed transaction report
 * @access  Private (Admin, Auditor)
 * @query   startDate, endDate, userId, status, groupBy
 */
router.get('/transactions', ReportsController.getTransactionReport);

/**
 * @route   GET /reports/land-plots
 * @desc    Get land plot report
 * @access  Private (Admin, Auditor)
 * @query   status, sizeMin, sizeMax, location
 */
router.get('/land-plots', ReportsController.getLandPlotReport);

/**
 * @route   GET /reports/user-performance
 * @desc    Get user performance report
 * @access  Private (Admin, Auditor)
 * @query   startDate, endDate, role
 */
router.get('/user-performance', ReportsController.getUserPerformanceReport);

/**
 * @route   GET /reports/disputed-plots
 * @desc    Get disputed plots report
 * @access  Private (Admin, Auditor)
 */
router.get('/disputed-plots', ReportsController.getDisputedPlotsReport);

/**
 * @route   GET /reports/monthly-trends
 * @desc    Get monthly trends report
 * @access  Private (Admin, Auditor)
 * @query   months
 */
router.get('/monthly-trends', ReportsController.getMonthlyTrends);

export default router;