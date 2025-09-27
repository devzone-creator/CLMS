import { Transaction, LandPlot, User } from '../models/index.js';
import LandService from './landService.js';
import { Op } from 'sequelize';

class TransactionService {

  /**
   * Record a new transaction
   * @param {Object} transactionData - Transaction data
   * @param {string} transactionData.landPlotId - Land plot ID
   * @param {string} transactionData.buyerName - Buyer name
   * @param {string} transactionData.buyerContact - Buyer contact
   * @param {string} transactionData.sellerName - Seller name
   * @param {string} transactionData.sellerContact - Seller contact
   * @param {number} transactionData.salePrice - Sale price
   * @param {number} transactionData.commissionRate - Commission rate (optional)
   * @param {string} transactionData.transactionDate - Transaction date (optional)
   * @param {string} createdBy - User ID who created the transaction
   * @returns {Object} Created transaction with land plot details
   */
  static async recordTransaction(transactionData, createdBy) {
    try {
      // Validate land plot exists and is available
      const landPlot = await LandPlot.findByPk(transactionData.landPlotId);
      if (!landPlot) {
        throw new Error('Land plot not found');
      }

      if (landPlot.status === 'SOLD') {
        throw new Error('Land plot is already sold');
      }

      if (landPlot.status === 'DISPUTED') {
        throw new Error('Cannot sell disputed land plot');
      }

      // Validate user exists
      const user = await User.findByPk(createdBy);
      if (!user) {
        throw new Error('User not found');
      }

      // Use default commission rate if not provided
      const commissionRate = transactionData.commissionRate || parseFloat(process.env.COMMISSION_RATE) || 0.10;

      // Create transaction
      const transaction = await Transaction.create({
        landPlotId: transactionData.landPlotId,
        buyerName: transactionData.buyerName.trim(),
        buyerContact: transactionData.buyerContact.trim(),
        sellerName: transactionData.sellerName.trim(),
        sellerContact: transactionData.sellerContact.trim(),
        salePrice: parseFloat(transactionData.salePrice),
        commissionRate: commissionRate,
        transactionDate: transactionData.transactionDate || new Date(),
        createdBy: createdBy
      });

      // Update land plot status to SOLD
      await LandService.markAsSold(transactionData.landPlotId);

      // Return transaction with related data
      const transactionWithDetails = await Transaction.findByPk(transaction.id, {
        include: [
          {
            model: LandPlot,
            as: 'landPlot',
            attributes: ['id', 'plotNumber', 'location', 'size', 'sizeUnit', 'status']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ]
      });

      return transactionWithDetails;

    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map(err => err.message);
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Get all transactions with filtering and pagination
   * @param {Object} options - Query options
   * @param {number} options.page - Page number (default: 1)
   * @param {number} options.limit - Items per page (default: 10)
   * @param {string} options.buyerName - Filter by buyer name (partial match)
   * @param {string} options.sellerName - Filter by seller name (partial match)
   * @param {string} options.plotNumber - Filter by plot number
   * @param {string} options.startDate - Start date filter (YYYY-MM-DD)
   * @param {string} options.endDate - End date filter (YYYY-MM-DD)
   * @param {number} options.minPrice - Minimum price filter
   * @param {number} options.maxPrice - Maximum price filter
   * @param {string} options.sortBy - Sort field (default: transactionDate)
   * @param {string} options.sortOrder - Sort order (ASC/DESC, default: DESC)
   * @returns {Object} Paginated transactions with metadata
   */
  static async getAllTransactions(options = {}) {
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
      } = options;

      // Build where clause
      const whereClause = {};

      if (buyerName) {
        whereClause.buyerName = {
          [Op.like]: `%${buyerName}%`
        };
      }

      if (sellerName) {
        whereClause.sellerName = {
          [Op.like]: `%${sellerName}%`
        };
      }

      if (startDate || endDate) {
        whereClause.transactionDate = {};
        if (startDate) whereClause.transactionDate[Op.gte] = startDate;
        if (endDate) whereClause.transactionDate[Op.lte] = endDate;
      }

      if (minPrice || maxPrice) {
        whereClause.salePrice = {};
        if (minPrice) whereClause.salePrice[Op.gte] = parseFloat(minPrice);
        if (maxPrice) whereClause.salePrice[Op.lte] = parseFloat(maxPrice);
      }

      // Build include clause for land plot filtering
      const includeClause = [
        {
          model: LandPlot,
          as: 'landPlot',
          attributes: ['id', 'plotNumber', 'location', 'size', 'sizeUnit', 'status'],
          ...(plotNumber && {
            where: {
              plotNumber: {
                [Op.like]: `%${plotNumber}%`
              }
            }
          })
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ];

      // Calculate offset
      const offset = (page - 1) * limit;

      // Valid sort fields
      const validSortFields = ['transactionDate', 'salePrice', 'commissionAmount', 'buyerName', 'sellerName', 'createdAt'];
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'transactionDate';

      // Execute query
      const { count, rows } = await Transaction.findAndCountAll({
        where: whereClause,
        include: includeClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sortField, sortOrder.toUpperCase()]],
        distinct: true
      });

      // Calculate pagination metadata
      const totalPages = Math.ceil(count / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        transactions: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit),
          hasNextPage,
          hasPrevPage
        }
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Get transaction by ID
   * @param {string} transactionId - Transaction ID
   * @returns {Object} Transaction with related data
   */
  static async getTransactionById(transactionId) {
    try {
      const transaction = await Transaction.findByPk(transactionId, {
        include: [
          {
            model: LandPlot,
            as: 'landPlot',
            attributes: ['id', 'plotNumber', 'location', 'size', 'sizeUnit', 'status', 'ownerName']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ]
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      return transaction;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Get transactions by user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Object} User's transactions
   */
  static async getTransactionsByUser(userId, options = {}) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return this.getAllTransactions({
        ...options,
        createdBy: userId
      });

    } catch (error) {
      throw error;
    }
  }

  /**
   * Get transactions by date range
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @param {Object} options - Additional options
   * @returns {Object} Transactions in date range
   */
  static async getTransactionsByDateRange(startDate, endDate, options = {}) {
    return this.getAllTransactions({
      ...options,
      startDate,
      endDate
    });
  }

  /**
   * Get transaction statistics
   * @param {Object} filters - Optional filters
   * @returns {Object} Transaction statistics
   */
  static async getTransactionStatistics(filters = {}) {
    try {
      const whereClause = {};

      // Apply date filters if provided
      if (filters.startDate || filters.endDate) {
        whereClause.transactionDate = {};
        if (filters.startDate) whereClause.transactionDate[Op.gte] = filters.startDate;
        if (filters.endDate) whereClause.transactionDate[Op.lte] = filters.endDate;
      }

      // Get basic statistics
      const stats = await Transaction.findAll({
        where: whereClause,
        attributes: [
          [Transaction.sequelize.fn('COUNT', Transaction.sequelize.col('id')), 'totalTransactions'],
          [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('salePrice')), 'totalRevenue'],
          [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('commissionAmount')), 'totalCommission'],
          [Transaction.sequelize.fn('AVG', Transaction.sequelize.col('salePrice')), 'averagePrice'],
          [Transaction.sequelize.fn('MIN', Transaction.sequelize.col('salePrice')), 'minPrice'],
          [Transaction.sequelize.fn('MAX', Transaction.sequelize.col('salePrice')), 'maxPrice']
        ]
      });

      const result = stats[0].dataValues;

      // Get monthly breakdown
      const monthlyStats = await Transaction.findAll({
        where: whereClause,
        attributes: [
          [Transaction.sequelize.fn('strftime', '%Y-%m', Transaction.sequelize.col('transactionDate')), 'month'],
          [Transaction.sequelize.fn('COUNT', Transaction.sequelize.col('id')), 'count'],
          [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('salePrice')), 'revenue'],
          [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('commissionAmount')), 'commission']
        ],
        group: [Transaction.sequelize.fn('strftime', '%Y-%m', Transaction.sequelize.col('transactionDate'))],
        order: [[Transaction.sequelize.fn('strftime', '%Y-%m', Transaction.sequelize.col('transactionDate')), 'DESC']]
      });

      return {
        totalTransactions: parseInt(result.totalTransactions) || 0,
        totalRevenue: parseFloat(result.totalRevenue) || 0,
        totalCommission: parseFloat(result.totalCommission) || 0,
        averagePrice: parseFloat(result.averagePrice) || 0,
        minPrice: parseFloat(result.minPrice) || 0,
        maxPrice: parseFloat(result.maxPrice) || 0,
        netRevenue: (parseFloat(result.totalRevenue) || 0) - (parseFloat(result.totalCommission) || 0),
        monthlyBreakdown: monthlyStats.map(stat => ({
          month: stat.dataValues.month,
          transactions: parseInt(stat.dataValues.count),
          revenue: parseFloat(stat.dataValues.revenue) || 0,
          commission: parseFloat(stat.dataValues.commission) || 0
        }))
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Update transaction (limited fields)
   * @param {string} transactionId - Transaction ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated transaction
   */
  static async updateTransaction(transactionId, updateData) {
    try {
      const transaction = await Transaction.findByPk(transactionId);

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Only allow updating certain fields
      const allowedFields = ['buyerContact', 'sellerContact', 'receiptPath'];
      const cleanUpdateData = {};

      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key)) {
          cleanUpdateData[key] = updateData[key];
        }
      });

      if (Object.keys(cleanUpdateData).length === 0) {
        throw new Error('No valid fields to update');
      }

      await transaction.update(cleanUpdateData);

      return this.getTransactionById(transactionId);

    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map(err => err.message);
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Calculate commission for a given price
   * @param {number} salePrice - Sale price
   * @param {number} commissionRate - Commission rate (optional)
   * @returns {Object} Commission calculation details
   */
  static calculateCommission(salePrice, commissionRate = null) {
    const rate = commissionRate || parseFloat(process.env.COMMISSION_RATE) || 0.10;
    const commission = parseFloat((salePrice * rate).toFixed(2));
    const netAmount = parseFloat((salePrice - commission).toFixed(2));

    return {
      salePrice: parseFloat(salePrice),
      commissionRate: rate,
      commissionAmount: commission,
      netAmount: netAmount,
      commissionPercentage: `${(rate * 100).toFixed(2)}%`
    };
  }

  /**
   * Get recent transactions
   * @param {number} limit - Number of recent transactions (default: 10)
   * @returns {Array} Recent transactions
   */
  static async getRecentTransactions(limit = 10) {
    try {
      const transactions = await Transaction.findAll({
        include: [
          {
            model: LandPlot,
            as: 'landPlot',
            attributes: ['plotNumber', 'location']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['firstName', 'lastName']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit)
      });

      return transactions;

    } catch (error) {
      throw error;
    }
  }
}

export default TransactionService;