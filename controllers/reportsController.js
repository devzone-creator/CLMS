import ReportsService from '../services/reportsService.js';

class ReportsController {

  /**
   * Get business summary report
   * GET /reports/summary
   */
  static async getBusinessSummary(req, res) {
    try {
      const { startDate, endDate, userId } = req.query;

      // Validate date formats if provided
      if (startDate && !isValidDate(startDate)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_DATE_FORMAT',
            message: 'Start date must be in YYYY-MM-DD format'
          }
        });
      }

      if (endDate && !isValidDate(endDate)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_DATE_FORMAT',
            message: 'End date must be in YYYY-MM-DD format'
          }
        });
      }

      // Validate date range
      if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_DATE_RANGE',
            message: 'Start date cannot be after end date'
          }
        });
      }

      const filters = { startDate, endDate, userId };
      const report = await ReportsService.getBusinessSummary(filters);

      res.status(200).json({
        success: true,
        data: report,
        message: 'Business summary report generated successfully'
      });

    } catch (error) {
      console.error('Error generating business summary:', error);

      res.status(500).json({
        success: false,
        error: {
          code: 'REPORT_GENERATION_ERROR',
          message: 'Failed to generate business summary report'
        }
      });
    }
  }

  /**
   * Get detailed transaction report
   * GET /reports/transactions
   */
  static async getTransactionReport(req, res) {
    try {
      const { startDate, endDate, userId, status, groupBy = 'date' } = req.query;

      // Validate date formats if provided
      if (startDate && !isValidDate(startDate)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_DATE_FORMAT',
            message: 'Start date must be in YYYY-MM-DD format'
          }
        });
      }

      if (endDate && !isValidDate(endDate)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_DATE_FORMAT',
            message: 'End date must be in YYYY-MM-DD format'
          }
        });
      }

      // Validate groupBy parameter
      const validGroupBy = ['date', 'user', 'status'];
      if (!validGroupBy.includes(groupBy)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_GROUP_BY',
            message: `Group by must be one of: ${validGroupBy.join(', ')}`
          }
        });
      }

      // Validate status parameter
      if (status) {
        const validStatuses = ['AVAILABLE', 'SOLD', 'DISPUTED', 'RESERVED'];
        if (!validStatuses.includes(status.toUpperCase())) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_STATUS',
              message: `Status must be one of: ${validStatuses.join(', ')}`
            }
          });
        }
      }

      const filters = { startDate, endDate, userId, status, groupBy };
      const report = await ReportsService.getTransactionReport(filters);

      res.status(200).json({
        success: true,
        data: report,
        message: 'Transaction report generated successfully'
      });

    } catch (error) {
      console.error('Error generating transaction report:', error);

      res.status(500).json({
        success: false,
        error: {
          code: 'REPORT_GENERATION_ERROR',
          message: 'Failed to generate transaction report'
        }
      });
    }
  }

  /**
   * Get land plot report
   * GET /reports/land-plots
   */
  static async getLandPlotReport(req, res) {
    try {
      const { status, sizeMin, sizeMax, location } = req.query;

      // Validate status parameter
      if (status) {
        const validStatuses = ['AVAILABLE', 'SOLD', 'DISPUTED', 'RESERVED'];
        if (!validStatuses.includes(status.toUpperCase())) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_STATUS',
              message: `Status must be one of: ${validStatuses.join(', ')}`
            }
          });
        }
      }

      // Validate size parameters
      if (sizeMin && (isNaN(parseFloat(sizeMin)) || parseFloat(sizeMin) < 0)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_SIZE_MIN',
            message: 'Minimum size must be a positive number'
          }
        });
      }

      if (sizeMax && (isNaN(parseFloat(sizeMax)) || parseFloat(sizeMax) < 0)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_SIZE_MAX',
            message: 'Maximum size must be a positive number'
          }
        });
      }

      if (sizeMin && sizeMax && parseFloat(sizeMin) > parseFloat(sizeMax)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_SIZE_RANGE',
            message: 'Minimum size cannot be greater than maximum size'
          }
        });
      }

      const filters = { status, sizeMin, sizeMax, location };
      const report = await ReportsService.getLandPlotReport(filters);

      res.status(200).json({
        success: true,
        data: report,
        message: 'Land plot report generated successfully'
      });

    } catch (error) {
      console.error('Error generating land plot report:', error);

      res.status(500).json({
        success: false,
        error: {
          code: 'REPORT_GENERATION_ERROR',
          message: 'Failed to generate land plot report'
        }
      });
    }
  }

  /**
   * Get user performance report
   * GET /reports/user-performance
   */
  static async getUserPerformanceReport(req, res) {
    try {
      const { startDate, endDate, role } = req.query;

      // Validate date formats if provided
      if (startDate && !isValidDate(startDate)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_DATE_FORMAT',
            message: 'Start date must be in YYYY-MM-DD format'
          }
        });
      }

      if (endDate && !isValidDate(endDate)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_DATE_FORMAT',
            message: 'End date must be in YYYY-MM-DD format'
          }
        });
      }

      // Validate role parameter
      if (role) {
        const validRoles = ['ADMIN', 'STAFF', 'AUDITOR'];
        if (!validRoles.includes(role.toUpperCase())) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_ROLE',
              message: `Role must be one of: ${validRoles.join(', ')}`
            }
          });
        }
      }

      const filters = { startDate, endDate, role };
      const report = await ReportsService.getUserPerformanceReport(filters);

      res.status(200).json({
        success: true,
        data: report,
        message: 'User performance report generated successfully'
      });

    } catch (error) {
      console.error('Error generating user performance report:', error);

      res.status(500).json({
        success: false,
        error: {
          code: 'REPORT_GENERATION_ERROR',
          message: 'Failed to generate user performance report'
        }
      });
    }
  }

  /**
   * Get disputed plots report
   * GET /reports/disputed-plots
   */
  static async getDisputedPlotsReport(req, res) {
    try {
      const report = await ReportsService.getDisputedPlotsReport();

      res.status(200).json({
        success: true,
        data: report,
        message: 'Disputed plots report generated successfully'
      });

    } catch (error) {
      console.error('Error generating disputed plots report:', error);

      res.status(500).json({
        success: false,
        error: {
          code: 'REPORT_GENERATION_ERROR',
          message: 'Failed to generate disputed plots report'
        }
      });
    }
  }

  /**
   * Get monthly trends report
   * GET /reports/monthly-trends
   */
  static async getMonthlyTrends(req, res) {
    try {
      const { months = 12 } = req.query;

      // Validate months parameter
      const monthsNum = parseInt(months);
      if (isNaN(monthsNum) || monthsNum < 1 || monthsNum > 60) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_MONTHS',
            message: 'Months must be a number between 1 and 60'
          }
        });
      }

      const filters = { months: monthsNum };
      const report = await ReportsService.getMonthlyTrends(filters);

      res.status(200).json({
        success: true,
        data: report,
        message: 'Monthly trends report generated successfully'
      });

    } catch (error) {
      console.error('Error generating monthly trends report:', error);

      res.status(500).json({
        success: false,
        error: {
          code: 'REPORT_GENERATION_ERROR',
          message: 'Failed to generate monthly trends report'
        }
      });
    }
  }
}

/**
 * Helper function to validate date format (YYYY-MM-DD)
 * @param {string} dateString - Date string to validate
 * @returns {boolean} True if valid date format
 */
function isValidDate(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date) && dateString === date.toISOString().split('T')[0];
}

export default ReportsController;