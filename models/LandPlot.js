import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const LandPlot = sequelize.define('LandPlot', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  plotNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: 'Plot number is required'
      },
      len: {
        args: [1, 50],
        msg: 'Plot number must be between 1 and 50 characters'
      }
    }
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Location is required'
      },
      len: {
        args: [2, 200],
        msg: 'Location must be between 2 and 200 characters'
      }
    }
  },
  size: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: {
        args: [0.01],
        msg: 'Size must be greater than 0'
      },
      isDecimal: {
        msg: 'Size must be a valid number'
      }
    }
  },
  sizeUnit: {
    type: DataTypes.ENUM('ACRES', 'HECTARES', 'SQ_METERS'),
    allowNull: false,
    defaultValue: 'ACRES',
    validate: {
      isIn: {
        args: [['ACRES', 'HECTARES', 'SQ_METERS']],
        msg: 'Size unit must be ACRES, HECTARES, or SQ_METERS'
      }
    }
  },
  status: {
    type: DataTypes.ENUM('AVAILABLE', 'SOLD', 'DISPUTED', 'RESERVED'),
    allowNull: false,
    defaultValue: 'AVAILABLE',
    validate: {
      isIn: {
        args: [['AVAILABLE', 'SOLD', 'DISPUTED', 'RESERVED']],
        msg: 'Status must be AVAILABLE, SOLD, DISPUTED, or RESERVED'
      }
    }
  },
  ownerName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Owner name is required'
      },
      len: {
        args: [2, 100],
        msg: 'Owner name must be between 2 and 100 characters'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: {
        args: [0, 1000],
        msg: 'Description cannot exceed 1000 characters'
      }
    }
  },
  registrationDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    validate: {
      isDate: {
        msg: 'Registration date must be a valid date'
      }
    }
  }
}, {
  tableName: 'land_plots',
  timestamps: true,
  hooks: {
    // Validate plot number format before saving
    beforeValidate: (landPlot) => {
      if (landPlot.plotNumber) {
        // Convert to uppercase and trim whitespace
        landPlot.plotNumber = landPlot.plotNumber.toString().toUpperCase().trim();
      }
    }
  }
});

// Instance method to get formatted size
LandPlot.prototype.getFormattedSize = function() {
  return `${this.size} ${this.sizeUnit.toLowerCase()}`;
};

// Instance method to check if plot is available for sale
LandPlot.prototype.isAvailable = function() {
  return this.status === 'AVAILABLE';
};

// Instance method to mark as sold
LandPlot.prototype.markAsSold = async function() {
  this.status = 'SOLD';
  return await this.save();
};

// Class method to find available plots
LandPlot.findAvailable = async function() {
  return await this.findAll({ 
    where: { status: 'AVAILABLE' },
    order: [['plotNumber', 'ASC']]
  });
};

// Class method to find plots by status
LandPlot.findByStatus = async function(status) {
  return await this.findAll({ 
    where: { status },
    order: [['plotNumber', 'ASC']]
  });
};

// Class method to search plots by location
LandPlot.searchByLocation = async function(locationQuery) {
  return await this.findAll({
    where: {
      location: {
        [sequelize.Sequelize.Op.like]: `%${locationQuery}%`
      }
    },
    order: [['plotNumber', 'ASC']]
  });
};

export default LandPlot;