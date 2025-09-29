import { Transaction, LandPlot, User } from '../models/index.js';
import { Op } from 'sequelize';

class ReportsService {

  /**
   * Get business summary report
   * @param {Object} filters - Optional filters
   * @param {string} filters.startDate - Start date filter (YYYY-MM-DD)
   * @param {string} filters.endDate - End date filter (YYYY-MM-DD)
   * @param {string} filters.userId - Filter by specific user
   * @returns {Object} Business summary data
   */
  static async getBusinessSummary(filters = {}) {
    try {
      const { startDate, endDate, userId } = filters;

      // Build where clause for transactions
      const transactionWhere = {};
      if (startDate || endDate) {
        transactionWhere.transactionDate = {};
        if (startDate) transactionWhere.transactionDate[Op.gte] = startDate;
        if (endDate) transactionWhere.transactionDate[Op.lte] = endDate;
      }
      if (userId) {
        transactionWhere.createdBy = userId;
      }

      // Get transaction statistics
      const transactionStats = await Transaction.findAll({
        where: transactionWhere,
        attributes: [
          [Transaction.sequelize.fn('COUNT', Transaction.sequelize.col('id')), 'totalTransactions'],
          [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('salePrice')), 'totalRevenue'],
          [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('commissionAmount')), 'totalCommission'],
          [Transaction.sequelize.fn('AVG', Transaction.sequelize.col('salePrice')), 'averagePrice'],
          [Transaction.sequelize.fn('MIN', Transaction.sequelize.col('salePrice')), 'minPrice'],
          [Transaction.sequelize.fn('MAX', Transaction.sequelize.col('salePrice')), 'maxPrice']
        ]
      });

      const stats = transactionStats[0].dataValues;

      // Get land plot statistics
      const landStats = await LandPlot.findAll({
        attributes: [
          'status',
          [LandPlot.sequelize.fn('COUNT', LandPlot.sequelize.col('id')), 'count']
        ],
        group: ['status']
      });

      // Process land statistics
      const landStatistics = {
        total: 0,
        available: 0,
        sold: 0,
        disputed: 0,
        reserved: 0
      };

      landStats.forEach(stat => {
        const status = stat.dataValues.status.toLowerCase();
        const count = parseInt(stat.dataValues.count);
        landStatistics.total += count;
        landStatistics[status] = count;
      });

      // Get recent transactions for trend analysis
      const recentTransactions = await Transaction.findAll({
        where: transactionWhere,
        attributes: [
          [Transaction.sequelize.fn('DATE', Transaction.sequelize.col('transactionDate')), 'date'],
          [Transaction.sequelize.fn('COUNT', Transaction.sequelize.col('id')), 'count'],
          [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('salePrice')), 'revenue']
        ],
        group: [Transaction.sequelize.fn('DATE', Transaction.sequelize.col('transactionDate'))],
        order: [[Transaction.sequelize.fn('DATE', Transaction.sequelize.col('transactionDate')), 'DESC']],
        limit: 30
      });

      // Calculate derived metrics
      const totalRevenue = parseFloat(stats.totalRevenue) || 0;
      const totalCommission = parseFloat(stats.totalCommission) || 0;
      const netRevenue = totalRevenue - totalCommission;
      const averageCommissionRate = totalRevenue > 0 ? (totalCommission / totalRevenue) : 0;

      return {
        summary: {
          totalTransactions: parseInt(stats.totalTransactions) || 0,
          totalRevenue: totalRevenue,
          totalCommission: totalCommission,
          netRevenue: netRevenue,
          averagePrice: parseFloat(stats.averagePrice) || 0,
          minPrice: parseFloat(stats.minPrice) || 0,
          maxPrice: parseFloat(stats.maxPrice) || 0,
          averageCommissionRate: averageCommissionRate
        },
        landStatistics: landStatistics,
        recentActivity: recentTransactions.map(transaction => ({
          date: transaction.dataValues.date,
          transactions: parseInt(transaction.dataValues.count),
          revenue: parseFloat(transaction.dataValues.revenue) || 0
        })),
        period: {
          startDate: startDate || 'All time',
          endDate: endDate || 'Present',
          userId: userId || 'All users'
        }
      };

    } catch (error) {
      throw new Error(`Failed to generate business summary: ${error.message}`);
    }
  }

  /**
   * Get detailed transaction report
   * @param {Object} filters - Report filters
   * @param {string} filters.startDate - Start date filter
   * @param {string} filters.endDate - End date filter
   * @param {string} filters.userId - User filter
   * @param {string} filters.status - Land plot status filter
   * @param {string} filters.groupBy - Group by field (date, user, status)
   * @returns {Object} Detailed transaction report
   */
  static async getTransactionReport(filters = {}) {
    try {
      const { startDate, endDate, userId, status, groupBy = 'date' } = filters;

      // Build where clause
      const whereClause = {};
      if (startDate || endDate) {
        whereClause.transactionDate = {};
        if (startDate) whereClause.transactionDate[Op.gte] = startDate;
        if (endDate) whereClause.transactionDate[Op.lte] = endDate;
      }
      if (userId) {
        whereClause.createdBy = userId;
      }

      // Build include clause for land plot status filter
      const includeClause = [
        {
          model: LandPlot,
          as: 'landPlot',
          attributes: ['plotNumber', 'location', 'status'],
          ...(status && {
            where: { status: status.toUpperCase() }
          })
        },
        {
          model: User,
          as: 'creator',
          attributes: ['firstName', 'lastName', 'email']
        }
      ];

      // Get transactions with grouping
      let groupByClause = [];
      let selectFields = [
        [Transaction.sequelize.fn('COUNT', Transaction.sequelize.col('Transaction.id')), 'transactionCount'],
        [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('salePrice')), 'totalRevenue'],
        [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('commissionAmount')), 'totalCommission'],
        [Transaction.sequelize.fn('AVG', Transaction.sequelize.col('salePrice')), 'averagePrice']
      ];

      switch (groupBy) {
        case 'date':
          selectFields.push([Transaction.sequelize.fn('DATE', Transaction.sequelize.col('transactionDate')), 'groupKey']);
          groupByClause = [Transaction.sequelize.fn('DATE', Transaction.sequelize.col('transactionDate'))];
          break;
        case 'user':
          selectFields.push([Transaction.sequelize.col('creator.firstName'), 'firstName']);
          selectFields.push([Transaction.sequelize.col('creator.lastName'), 'lastName']);
          selectFields.push([Transaction.sequelize.col('creator.email'), 'groupKey']);
          groupByClause = ['creator.id', 'creator.firstName', 'creator.lastName', 'creator.email'];
          break;
        case 'status':
          selectFields.push([Transaction.sequelize.col('landPlot.status'), 'groupKey']);
          groupByClause = ['landPlot.status'];
          break;
        default:
          selectFields.push([Transaction.sequelize.fn('DATE', Transaction.sequelize.col('transactionDate')), 'groupKey']);
          groupByClause = [Transaction.sequelize.fn('DATE', Transaction.sequelize.col('transactionDate'))];
      }

      const groupedData = await Transaction.findAll({
        where: whereClause,
        include: includeClause,
        attributes: selectFields,
        group: groupByClause,
        order: [[Transaction.sequelize.literal('groupKey'), 'DESC']],
        raw: false
      });

      // Get overall totals
      const totals = await Transaction.findAll({
        where: whereClause,
        include: includeClause,
        attributes: [
          [Transaction.sequelize.fn('COUNT', Transaction.sequelize.col('Transaction.id')), 'totalTransactions'],
          [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('salePrice')), 'totalRevenue'],
          [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('commissionAmount')), 'totalCommission']
        ]
      });

      const totalStats = totals[0].dataValues;

      return {
        groupBy: groupBy,
        data: groupedData.map(item => {
          const data = item.dataValues;
          return {
            groupKey: data.groupKey,
            firstName: data.firstName || null,
            lastName: data.lastName || null,
            transactionCount: parseInt(data.transactionCount),
            totalRevenue: parseFloat(data.totalRevenue) || 0,
            totalCommission: parseFloat(data.totalCommission) || 0,
            averagePrice: parseFloat(data.averagePrice) || 0,
            netRevenue: (parseFloat(data.totalRevenue) || 0) - (parseFloat(data.totalCommission) || 0)
          };
        }),
        totals: {
          totalTransactions: parseInt(totalStats.totalTransactions) || 0,
          totalRevenue: parseFloat(totalStats.totalRevenue) || 0,
          totalCommission: parseFloat(totalStats.totalCommission) || 0,
          netRevenue: (parseFloat(totalStats.totalRevenue) || 0) - (parseFloat(totalStats.totalCommission) || 0)
        },
        filters: filters
      };

    } catch (error) {
      throw new Error(`Failed to generate transaction report: ${error.message}`);
    }
  }  /**
 
  * Get land plot report
   * @param {Object} filters - Report filters
   * @param {string} filters.status - Status filter
   * @param {string} filters.sizeMin - Minimum size filter
   * @param {string} filters.sizeMax - Maximum size filter
   * @param {string} filters.location - Location filter (partial match)
   * @returns {Object} Land plot report
   */
  static async getLandPlotReport(filters = {}) {
    try {
      const { status, sizeMin, sizeMax, location } = filters;

      // Build where clause
      const whereClause = {};
      if (status) {
        whereClause.status = status.toUpperCase();
      }
      if (sizeMin || sizeMax) {
        whereClause.size = {};
        if (sizeMin) whereClause.size[Op.gte] = parseFloat(sizeMin);
        if (sizeMax) whereClause.size[Op.lte] = parseFloat(sizeMax);
      }
      if (location) {
        whereClause.location = {
          [Op.like]: `%${location}%`
        };
      }

      // Get land plots with transaction count
      const landPlots = await LandPlot.findAll({
        where: whereClause,
        include: [
          {
            model: Transaction,
            as: 'transactions',
            attributes: ['id', 'salePrice', 'transactionDate'],
            required: false
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      // Get summary statistics
      const summaryStats = await LandPlot.findAll({
        where: whereClause,
        attributes: [
          [LandPlot.sequelize.fn('COUNT', LandPlot.sequelize.col('id')), 'totalPlots'],
          [LandPlot.sequelize.fn('SUM', LandPlot.sequelize.col('size')), 'totalSize'],
          [LandPlot.sequelize.fn('AVG', LandPlot.sequelize.col('size')), 'averageSize'],
          [LandPlot.sequelize.fn('MIN', LandPlot.sequelize.col('size')), 'minSize'],
          [LandPlot.sequelize.fn('MAX', LandPlot.sequelize.col('size')), 'maxSize']
        ]
      });

      const stats = summaryStats[0].dataValues;

      // Group by status
      const statusBreakdown = await LandPlot.findAll({
        where: whereClause,
        attributes: [
          'status',
          [LandPlot.sequelize.fn('COUNT', LandPlot.sequelize.col('id')), 'count'],
          [LandPlot.sequelize.fn('SUM', LandPlot.sequelize.col('size')), 'totalSize']
        ],
        group: ['status']
      });

      // Group by size unit
      const sizeUnitBreakdown = await LandPlot.findAll({
        where: whereClause,
        attributes: [
          'sizeUnit',
          [LandPlot.sequelize.fn('COUNT', LandPlot.sequelize.col('id')), 'count'],
          [LandPlot.sequelize.fn('SUM', LandPlot.sequelize.col('size')), 'totalSize']
        ],
        group: ['sizeUnit']
      });

      return {
        summary: {
          totalPlots: parseInt(stats.totalPlots) || 0,
          totalSize: parseFloat(stats.totalSize) || 0,
          averageSize: parseFloat(stats.averageSize) || 0,
          minSize: parseFloat(stats.minSize) || 0,
          maxSize: parseFloat(stats.maxSize) || 0
        },
        statusBreakdown: statusBreakdown.map(item => ({
          status: item.dataValues.status,
          count: parseInt(item.dataValues.count),
          totalSize: parseFloat(item.dataValues.totalSize) || 0
        })),
        sizeUnitBreakdown: sizeUnitBreakdown.map(item => ({
          sizeUnit: item.dataValues.sizeUnit,
          count: parseInt(item.dataValues.count),
          totalSize: parseFloat(item.dataValues.totalSize) || 0
        })),
        plots: landPlots.map(plot => ({
          id: plot.id,
          plotNumber: plot.plotNumber,
          location: plot.location,
          size: plot.size,
          sizeUnit: plot.sizeUnit,
          status: plot.status,
          ownerName: plot.ownerName,
          transactionCount: plot.transactions.length,
          lastSalePrice: plot.transactions.length > 0 ? 
            Math.max(...plot.transactions.map(t => parseFloat(t.salePrice))) : null,
          lastSaleDate: plot.transactions.length > 0 ? 
            plot.transactions.reduce((latest, t) => 
              new Date(t.transactionDate) > new Date(latest) ? t.transactionDate : latest, 
              plot.transactions[0].transactionDate
            ) : null
        })),
        filters: filters
      };

    } catch (error) {
      throw new Error(`Failed to generate land plot report: ${error.message}`);
    }
  }

  /**
   * Get user performance report
   * @param {Object} filters - Report filters
   * @param {string} filters.startDate - Start date filter
   * @param {string} filters.endDate - End date filter
   * @param {string} filters.role - User role filter
   * @returns {Object} User performance report
   */
  static async getUserPerformanceReport(filters = {}) {
    try {
      const { startDate, endDate, role } = filters;

      // Build where clause for users
      const userWhere = {};
      if (role) {
        userWhere.role = role.toUpperCase();
      }

      // Build where clause for transactions
      const transactionWhere = {};
      if (startDate || endDate) {
        transactionWhere.transactionDate = {};
        if (startDate) transactionWhere.transactionDate[Op.gte] = startDate;
        if (endDate) transactionWhere.transactionDate[Op.lte] = endDate;
      }

      // Get users with their transaction statistics
      const users = await User.findAll({
        where: userWhere,
        include: [
          {
            model: Transaction,
            as: 'transactions',
            where: transactionWhere,
            required: false,
            attributes: ['id', 'salePrice', 'commissionAmount', 'transactionDate']
          }
        ],
        attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'createdAt']
      });

      // Calculate performance metrics for each user
      const userPerformance = users.map(user => {
        const transactions = user.transactions || [];
        const totalTransactions = transactions.length;
        const totalRevenue = transactions.reduce((sum, t) => sum + parseFloat(t.salePrice), 0);
        const totalCommission = transactions.reduce((sum, t) => sum + parseFloat(t.commissionAmount), 0);
        const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

        return {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role,
          joinDate: user.createdAt,
          performance: {
            totalTransactions,
            totalRevenue,
            totalCommission,
            averageTransactionValue,
            netRevenue: totalRevenue - totalCommission
          }
        };
      });

      // Sort by total revenue (descending)
      userPerformance.sort((a, b) => b.performance.totalRevenue - a.performance.totalRevenue);

      // Calculate overall statistics
      const overallStats = {
        totalUsers: userPerformance.length,
        activeUsers: userPerformance.filter(u => u.performance.totalTransactions > 0).length,
        totalTransactions: userPerformance.reduce((sum, u) => sum + u.performance.totalTransactions, 0),
        totalRevenue: userPerformance.reduce((sum, u) => sum + u.performance.totalRevenue, 0),
        totalCommission: userPerformance.reduce((sum, u) => sum + u.performance.totalCommission, 0)
      };

      return {
        summary: overallStats,
        userPerformance: userPerformance,
        topPerformers: userPerformance.slice(0, 5),
        filters: filters
      };

    } catch (error) {
      throw new Error(`Failed to generate user performance report: ${error.message}`);
    }
  }

  /**
   * Get disputed plots report
   * @returns {Object} Disputed plots report
   */
  static async getDisputedPlotsReport() {
    try {
      // Get all disputed plots
      const disputedPlots = await LandPlot.findAll({
        where: { status: 'DISPUTED' },
        include: [
          {
            model: Transaction,
            as: 'transactions',
            attributes: ['id', 'salePrice', 'transactionDate', 'buyerName', 'sellerName'],
            include: [
              {
                model: User,
                as: 'creator',
                attributes: ['firstName', 'lastName', 'email']
              }
            ]
          }
        ],
        order: [['updatedAt', 'DESC']]
      });

      // Calculate dispute statistics
      const totalDisputed = disputedPlots.length;
      const totalDisputedSize = disputedPlots.reduce((sum, plot) => sum + parseFloat(plot.size), 0);
      const averageDisputedSize = totalDisputed > 0 ? totalDisputedSize / totalDisputed : 0;

      // Group by location for analysis
      const locationBreakdown = {};
      disputedPlots.forEach(plot => {
        const location = plot.location;
        if (!locationBreakdown[location]) {
          locationBreakdown[location] = {
            count: 0,
            totalSize: 0,
            plots: []
          };
        }
        locationBreakdown[location].count++;
        locationBreakdown[location].totalSize += parseFloat(plot.size);
        locationBreakdown[location].plots.push(plot.plotNumber);
      });

      return {
        summary: {
          totalDisputedPlots: totalDisputed,
          totalDisputedSize: totalDisputedSize,
          averageDisputedSize: averageDisputedSize
        },
        disputedPlots: disputedPlots.map(plot => ({
          id: plot.id,
          plotNumber: plot.plotNumber,
          location: plot.location,
          size: plot.size,
          sizeUnit: plot.sizeUnit,
          ownerName: plot.ownerName,
          description: plot.description,
          lastUpdated: plot.updatedAt,
          transactionHistory: plot.transactions.map(t => ({
            id: t.id,
            salePrice: t.salePrice,
            transactionDate: t.transactionDate,
            buyerName: t.buyerName,
            sellerName: t.sellerName,
            createdBy: t.creator ? `${t.creator.firstName} ${t.creator.lastName}` : 'Unknown'
          }))
        })),
        locationBreakdown: Object.entries(locationBreakdown).map(([location, data]) => ({
          location,
          count: data.count,
          totalSize: data.totalSize,
          plotNumbers: data.plots
        }))
      };

    } catch (error) {
      throw new Error(`Failed to generate disputed plots report: ${error.message}`);
    }
  }

  /**
   * Get monthly trends report
   * @param {Object} filters - Report filters
   * @param {number} filters.months - Number of months to include (default: 12)
   * @returns {Object} Monthly trends report
   */
  static async getMonthlyTrends(filters = {}) {
    try {
      const { months = 12 } = filters;

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      // Get monthly transaction data
      const monthlyData = await Transaction.findAll({
        where: {
          transactionDate: {
            [Op.gte]: startDate,
            [Op.lte]: endDate
          }
        },
        attributes: [
          [Transaction.sequelize.fn('strftime', '%Y-%m', Transaction.sequelize.col('transactionDate')), 'month'],
          [Transaction.sequelize.fn('COUNT', Transaction.sequelize.col('id')), 'transactionCount'],
          [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('salePrice')), 'totalRevenue'],
          [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('commissionAmount')), 'totalCommission'],
          [Transaction.sequelize.fn('AVG', Transaction.sequelize.col('salePrice')), 'averagePrice']
        ],
        group: [Transaction.sequelize.fn('strftime', '%Y-%m', Transaction.sequelize.col('transactionDate'))],
        order: [[Transaction.sequelize.fn('strftime', '%Y-%m', Transaction.sequelize.col('transactionDate')), 'ASC']]
      });

      // Get monthly land plot registration data
      const monthlyLandData = await LandPlot.findAll({
        where: {
          createdAt: {
            [Op.gte]: startDate,
            [Op.lte]: endDate
          }
        },
        attributes: [
          [LandPlot.sequelize.fn('strftime', '%Y-%m', LandPlot.sequelize.col('createdAt')), 'month'],
          [LandPlot.sequelize.fn('COUNT', LandPlot.sequelize.col('id')), 'newPlots']
        ],
        group: [LandPlot.sequelize.fn('strftime', '%Y-%m', LandPlot.sequelize.col('createdAt'))],
        order: [[LandPlot.sequelize.fn('strftime', '%Y-%m', LandPlot.sequelize.col('createdAt')), 'ASC']]
      });

      // Merge data by month
      const trends = {};
      
      // Initialize all months with zero values
      for (let i = 0; i < months; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toISOString().substring(0, 7); // YYYY-MM format
        trends[monthKey] = {
          month: monthKey,
          transactionCount: 0,
          totalRevenue: 0,
          totalCommission: 0,
          averagePrice: 0,
          newPlots: 0
        };
      }

      // Add transaction data
      monthlyData.forEach(item => {
        const data = item.dataValues;
        if (trends[data.month]) {
          trends[data.month].transactionCount = parseInt(data.transactionCount);
          trends[data.month].totalRevenue = parseFloat(data.totalRevenue) || 0;
          trends[data.month].totalCommission = parseFloat(data.totalCommission) || 0;
          trends[data.month].averagePrice = parseFloat(data.averagePrice) || 0;
        }
      });

      // Add land plot data
      monthlyLandData.forEach(item => {
        const data = item.dataValues;
        if (trends[data.month]) {
          trends[data.month].newPlots = parseInt(data.newPlots);
        }
      });

      // Convert to array and sort by month
      const trendsArray = Object.values(trends).sort((a, b) => a.month.localeCompare(b.month));

      return {
        period: {
          startDate: startDate.toISOString().substring(0, 10),
          endDate: endDate.toISOString().substring(0, 10),
          months: months
        },
        trends: trendsArray,
        summary: {
          totalMonths: trendsArray.length,
          totalTransactions: trendsArray.reduce((sum, t) => sum + t.transactionCount, 0),
          totalRevenue: trendsArray.reduce((sum, t) => sum + t.totalRevenue, 0),
          totalCommission: trendsArray.reduce((sum, t) => sum + t.totalCommission, 0),
          totalNewPlots: trendsArray.reduce((sum, t) => sum + t.newPlots, 0)
        }
      };

    } catch (error) {
      throw new Error(`Failed to generate monthly trends report: ${error.message}`);
    }
  }
}

export default ReportsService;