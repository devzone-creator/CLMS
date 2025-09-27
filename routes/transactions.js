import express from 'express';
import TransactionController from '../controllers/transactionController.js';
import { authenticateToken } from '../middlewares/auth.js';
import { validateTransaction } from '../middlewares/validation.js';

const router = express.Router();

// All transaction routes require authentication
router.use(authenticateToken);

// POST /transactions - Record new transaction (ADMIN, STAFF)
router.post('/', 
  validateTransaction,
  TransactionController.recordTransaction
);

// GET /transactions/stats - Get transaction statistics (ADMIN, STAFF, AUDITOR)
router.get('/stats', TransactionController.getTransactionStatistics);

// GET /transactions/recent - Get recent transactions (ADMIN, STAFF, AUDITOR)
router.get('/recent', TransactionController.getRecentTransactions);

// POST /transactions/calculate-commission - Calculate commission (ADMIN, STAFF)
router.post('/calculate-commission', TransactionController.calculateCommission);

// GET /transactions - Get all transactions with filtering (ADMIN, STAFF, AUDITOR)
router.get('/', TransactionController.getAllTransactions);

// GET /transactions/:id - Get specific transaction (ADMIN, STAFF, AUDITOR)
router.get('/:id', TransactionController.getTransactionById);

export default router;