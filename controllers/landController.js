import LandService from '../services/landService.js';
import { validationResult } from 'express-validator';

class LandController {

  /**
   * Create a new land plot
   * POST /api/lands
   */
  static async createLandPlot(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array()
          }
        });
      }

      const landData = req.body;
      const landPlot = await LandService.createLandPlot(landData);

      res.status(201).json({
        success: true,
        message: 'Land plot created successfully',
        data: {
          landPlot
        }
      });

    } catch (error) {
      console.error('Create land plot error:', error);

      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'PLOT_NUMBER_EXISTS',
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
          code: 'CREATE_LAND_PLOT_ERROR',
          message: 'Failed to create land plot'
        }
      });
    }
  }

  /**
   * Get all land plots with filtering and pagination
   * GET /api/lands
   */
  static async getAllLandPlots(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        status: req.query.status,
        location: req.query.location,
        sortBy: req.query.sortBy || 'plotNumber',
        sortOrder: req.query.sortOrder || 'ASC'
      };

      // Validate limit
      if (options.limit > 100) {
        options.limit = 100; // Maximum 100 items per page
      }

      const result = await LandService.getAllLandPlots(options);

      res.json({
        success: true,
        message: 'Land plots retrieved successfully',
        data: result
      });

    } catch (error) {
      console.error('Get all land plots error:', error);

      res.status(500).json({
        success: false,
        error: {
          code: 'GET_LAND_PLOTS_ERROR',
          message: 'Failed to retrieve land plots'
        }
      });
    }
  }

  /**
   * Get land plot by ID
   * GET /api/lands/:id
   */
  static async getLandPlotById(req, res) {
    try {
      const { id } = req.params;
      const landPlot = await LandService.getLandPlotById(id);

      res.json({
        success: true,
        message: 'Land plot retrieved successfully',
        data: {
          landPlot
        }
      });

    } catch (error) {
      console.error('Get land plot by ID error:', error);

      if (error.message === 'Land plot not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'LAND_PLOT_NOT_FOUND',
            message: 'Land plot not found'
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'GET_LAND_PLOT_ERROR',
          message: 'Failed to retrieve land plot'
        }
      });
    }
  }

  /**
   * Update land plot
   * PUT /api/lands/:id
   */
  static async updateLandPlot(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array()
          }
        });
      }

      const { id } = req.params;
      const updateData = req.body;

      const landPlot = await LandService.updateLandPlot(id, updateData);

      res.json({
        success: true,
        message: 'Land plot updated successfully',
        data: {
          landPlot
        }
      });

    } catch (error) {
      console.error('Update land plot error:', error);

      if (error.message === 'Land plot not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'LAND_PLOT_NOT_FOUND',
            message: 'Land plot not found'
          }
        });
      }

      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'PLOT_NUMBER_EXISTS',
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
          code: 'UPDATE_LAND_PLOT_ERROR',
          message: 'Failed to update land plot'
        }
      });
    }
  }

  /**
   * Get available land plots
   * GET /api/lands/available
   */
  static async getAvailableLandPlots(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        location: req.query.location,
        sortBy: req.query.sortBy || 'plotNumber',
        sortOrder: req.query.sortOrder || 'ASC'
      };

      // Validate limit
      if (options.limit > 100) {
        options.limit = 100;
      }

      const result = await LandService.getAvailableLandPlots(options);

      res.json({
        success: true,
        message: 'Available land plots retrieved successfully',
        data: result
      });

    } catch (error) {
      console.error('Get available land plots error:', error);

      res.status(500).json({
        success: false,
        error: {
          code: 'GET_AVAILABLE_PLOTS_ERROR',
          message: 'Failed to retrieve available land plots'
        }
      });
    }
  }

  /**
   * Mark land plot as sold
   * PATCH /api/lands/:id/mark-sold
   */
  static async markAsSold(req, res) {
    try {
      const { id } = req.params;
      const landPlot = await LandService.markAsSold(id);

      res.json({
        success: true,
        message: 'Land plot marked as sold successfully',
        data: {
          landPlot
        }
      });

    } catch (error) {
      console.error('Mark as sold error:', error);

      if (error.message === 'Land plot not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'LAND_PLOT_NOT_FOUND',
            message: 'Land plot not found'
          }
        });
      }

      if (error.message.includes('already marked as sold')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'ALREADY_SOLD',
            message: error.message
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'MARK_SOLD_ERROR',
          message: 'Failed to mark land plot as sold'
        }
      });
    }
  }

  /**
   * Get land plot statistics
   * GET /api/lands/statistics
   */
  static async getStatistics(req, res) {
    try {
      const statistics = await LandService.getLandPlotStatistics();

      res.json({
        success: true,
        message: 'Land plot statistics retrieved successfully',
        data: {
          statistics
        }
      });

    } catch (error) {
      console.error('Get statistics error:', error);

      res.status(500).json({
        success: false,
        error: {
          code: 'GET_STATISTICS_ERROR',
          message: 'Failed to retrieve land plot statistics'
        }
      });
    }
  }
}

export default LandController;