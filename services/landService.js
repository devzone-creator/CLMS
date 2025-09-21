import { LandPlot, Transaction } from '../models/index.js';
import { Op } from 'sequelize';

class LandService {

  /**
   * Create a new land plot
   */
  static async createLandPlot(landData) {
    try {
      // Check if plot number already exists
      const existingPlot = await LandPlot.findOne({
        where: { plotNumber: landData.plotNumber.toUpperCase().trim() }
      });

      if (existingPlot) {
        throw new Error(`Plot number ${landData.plotNumber} already exists`);
      }

      // Create land plot
      const landPlot = await LandPlot.create({
        plotNumber: landData.plotNumber.toUpperCase().trim(),
        location: landData.location.trim(),
        size: parseFloat(landData.size),
        sizeUnit: landData.sizeUnit,
        ownerName: landData.ownerName.trim(),
        description: landData.description?.trim() || null,
        status: landData.status || 'AVAILABLE',
        registrationDate: landData.registrationDate || new Date()
      });

      return landPlot;

    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map(err => err.message);
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Get all land plots with filtering and pagination
   */
  static async getAllLandPlots(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        location,
        sortBy = 'plotNumber',
        sortOrder = 'ASC'
      } = options;

      // Build where clause
      const whereClause = {};

      if (status) {
        whereClause.status = status;
      }

      if (location) {
        whereClause.location = {
          [Op.like]: `%${location}%`
        };
      }

      // Calculate offset
      const offset = (page - 1) * limit;

      // Execute query
      const { count, rows } = await LandPlot.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sortBy, sortOrder.toUpperCase()]]
      });

      // Calculate pagination metadata
      const totalPages = Math.ceil(count / limit);

      return {
        landPlots: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit),
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Get land plot by ID
   */
  static async getLandPlotById(plotId) {
    try {
      const landPlot = await LandPlot.findByPk(plotId);

      if (!landPlot) {
        throw new Error('Land plot not found');
      }

      return landPlot;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Update land plot
   */
  static async updateLandPlot(plotId, updateData) {
    try {
      const landPlot = await LandPlot.findByPk(plotId);

      if (!landPlot) {
        throw new Error('Land plot not found');
      }

      // Check if plot number is being changed and if it already exists
      if (updateData.plotNumber && updateData.plotNumber !== landPlot.plotNumber) {
        const existingPlot = await LandPlot.findOne({
          where: { 
            plotNumber: updateData.plotNumber.toUpperCase().trim(),
            id: { [Op.ne]: plotId }
          }
        });

        if (existingPlot) {
          throw new Error(`Plot number ${updateData.plotNumber} already exists`);
        }
      }

      // Update land plot
      await landPlot.update(updateData);
      return landPlot;

    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map(err => err.message);
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Get available land plots
   */
  static async getAvailableLandPlots(options = {}) {
    return this.getAllLandPlots({
      ...options,
      status: 'AVAILABLE'
    });
  }

  /**
   * Mark land plot as sold
   */
  static async markAsSold(plotId) {
    try {
      const landPlot = await LandPlot.findByPk(plotId);

      if (!landPlot) {
        throw new Error('Land plot not found');
      }

      if (landPlot.status === 'SOLD') {
        throw new Error('Land plot is already marked as sold');
      }

      await landPlot.update({ status: 'SOLD' });
      return landPlot;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Get land plot statistics
   */
  static async getLandPlotStatistics() {
    try {
      const totalPlots = await LandPlot.count();
      
      const statusCounts = await LandPlot.findAll({
        attributes: [
          'status',
          [LandPlot.sequelize.fn('COUNT', LandPlot.sequelize.col('id')), 'count']
        ],
        group: ['status']
      });

      const statusStats = {};
      statusCounts.forEach(item => {
        statusStats[item.status] = parseInt(item.dataValues.count);
      });

      return {
        totalPlots,
        statusBreakdown: statusStats,
        availablePlots: statusStats.AVAILABLE || 0,
        soldPlots: statusStats.SOLD || 0,
        disputedPlots: statusStats.DISPUTED || 0,
        reservedPlots: statusStats.RESERVED || 0
      };

    } catch (error) {
      throw error;
    }
  }
}

export default LandService;