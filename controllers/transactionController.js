import TransactionService from '../services/transactionService.js';

class TransactionController {

    /**
     * Record a new transaction
     * POST /transactions
     */
    static async recordTransaction(req, res) {
        try {
            const {
                landPlotId,
                buyerName,
                buyerContact,
                sellerName,
                sellerContact,
                salePrice,
                commissionRate,
                transactionDate
            } = req.body;

            // Validate required fields
            if (!landPlotId || !buyerName || !buyerContact || !sellerName || !sellerContact || !salePrice) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Missing required fields: landPlotId, buyerName, buyerContact, sellerName, sellerContact, salePrice'
                    }
                });
            }

            // Validate sale price is positive
            if (parseFloat(salePrice) <= 0) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Sale price must be greater than 0'
                    }
                });
            }

            const transactionData = {
                landPlotId,
                buyerName,
                buyerContact,
                sellerName,
                sellerContact,
                salePrice,
                commissionRate,
                transactionDate
            };

            const transaction = await TransactionService.recordTransaction(transactionData, req.user.id);

            res.status(201).json({
                success: true,
                data: transaction,
                message: 'Transaction recorded successfully'
            });

        } catch (error) {
            console.error('Error recording transaction:', error);

            if (error.message.includes('not found') || error.message.includes('already sold') || error.message.includes('disputed')) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'BUSINESS_LOGIC_ERROR',
                        message: error.message
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
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to record transaction'
                }
            });
        }
    }
    /**
     * Get all transactions with filtering
     * GET /transactions
     */
    static async getAllTransactions(req, res) {
        try {
            const {
                page = 1,
                limit = 10,
                buyerName,
                sellerName,
                plotNumber,
                startDate,
                endDate,
                minPrice,
                maxPrice,
                sortBy = 'transactionDate',
                sortOrder = 'DESC'
            } = req.query;

            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                buyerName,
                sellerName,
                plotNumber,
                startDate,
                endDate,
                minPrice,
                maxPrice,
                sortBy,
                sortOrder
            };

            const result = await TransactionService.getAllTransactions(options);

            res.status(200).json({
                success: true,
                data: result.transactions,
                pagination: result.pagination,
                message: 'Transactions retrieved successfully'
            });

        } catch (error) {
            console.error('Error getting transactions:', error);

            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to retrieve transactions'
                }
            });
        }
    }

    /**
     * Get transaction by ID
     * GET /transactions/:id
     */
    static async getTransactionById(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Transaction ID is required'
                    }
                });
            }

            const transaction = await TransactionService.getTransactionById(id);

            res.status(200).json({
                success: true,
                data: transaction,
                message: 'Transaction retrieved successfully'
            });

        } catch (error) {
            console.error('Error getting transaction:', error);

            if (error.message === 'Transaction not found') {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Transaction not found'
                    }
                });
            }

            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to retrieve transaction'
                }
            });
        }
    }

    /**
     * Get transaction statistics
     * GET /transactions/stats
     */
    static async getTransactionStatistics(req, res) {
        try {
            const { startDate, endDate } = req.query;

            const filters = {};
            if (startDate) filters.startDate = startDate;
            if (endDate) filters.endDate = endDate;

            const stats = await TransactionService.getTransactionStatistics(filters);

            res.status(200).json({
                success: true,
                data: stats,
                message: 'Transaction statistics retrieved successfully'
            });

        } catch (error) {
            console.error('Error getting transaction statistics:', error);

            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to retrieve transaction statistics'
                }
            });
        }
    }

    /**
     * Get recent transactions
     * GET /transactions/recent
     */
    static async getRecentTransactions(req, res) {
        try {
            const { limit = 10 } = req.query;

            const transactions = await TransactionService.getRecentTransactions(parseInt(limit));

            res.status(200).json({
                success: true,
                data: transactions,
                message: 'Recent transactions retrieved successfully'
            });

        } catch (error) {
            console.error('Error getting recent transactions:', error);

            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to retrieve recent transactions'
                }
            });
        }
    }

    /**
     * Calculate commission for a price
     * POST /transactions/calculate-commission
     */
    static async calculateCommission(req, res) {
        try {
            const { salePrice, commissionRate } = req.body;

            if (!salePrice || parseFloat(salePrice) <= 0) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Valid sale price is required'
                    }
                });
            }

            const calculation = TransactionService.calculateCommission(parseFloat(salePrice), commissionRate);

            res.status(200).json({
                success: true,
                data: calculation,
                message: 'Commission calculated successfully'
            });

        } catch (error) {
            console.error('Error calculating commission:', error);

            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to calculate commission'
                }
            });
        }
    }
}

export default TransactionController;