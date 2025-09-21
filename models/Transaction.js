import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  landPlotId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'land_plots',
      key: 'id'
    },
    validate: {
      notEmpty: {
        msg: 'Land plot ID is required'
      }
    }
  },
  buyerName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Buyer name is required'
      },
      len: {
        args: [2, 100],
        msg: 'Buyer name must be between 2 and 100 characters'
      }
    }
  },
  buyerContact: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Buyer contact is required'
      },
      len: {
        args: [10, 50],
        msg: 'Buyer contact must be between 10 and 50 characters'
      }
    }
  },
  sellerName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Seller name is required'
      },
      len: {
        args: [2, 100],
        msg: 'Seller name must be between 2 and 100 characters'
      }
    }
  },
  sellerContact: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Seller contact is required'
      },
      len: {
        args: [10, 50],
        msg: 'Seller contact must be between 10 and 50 characters'
      }
    }
  },
  salePrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: {
        args: [0.01],
        msg: 'Sale price must be greater than 0'
      },
      isDecimal: {
        msg: 'Sale price must be a valid number'
      }
    }
  },
  commissionRate: {
    type: DataTypes.DECIMAL(5, 4),
    allowNull: false,
    defaultValue: 0.10, // 10% default commission
    validate: {
      min: {
        args: [0],
        msg: 'Commission rate cannot be negative'
      },
      max: {
        args: [1],
        msg: 'Commission rate cannot exceed 100%'
      }
    }
  },
  commissionAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0
  },
  transactionDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    validate: {
      isDate: {
        msg: 'Transaction date must be a valid date'
      }
    }
  },
  receiptPath: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: {
        args: [0, 500],
        msg: 'Receipt path cannot exceed 500 characters'
      }
    }
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    validate: {
      notEmpty: {
        msg: 'Created by user ID is required'
      }
    }
  }
}, {
  tableName: 'transactions',
  timestamps: true,
  hooks: {
    // Calculate commission before creating/updating transaction
    beforeValidate: (transaction) => {
      if (transaction.salePrice && transaction.commissionRate !== undefined) {
        transaction.commissionAmount = (parseFloat(transaction.salePrice) * parseFloat(transaction.commissionRate)).toFixed(2);
      }
    },
    beforeUpdate: (transaction) => {
      if (transaction.changed('salePrice') || transaction.changed('commissionRate')) {
        transaction.commissionAmount = (parseFloat(transaction.salePrice) * parseFloat(transaction.commissionRate)).toFixed(2);
      }
    }
  }
});

// Instance method to get formatted sale price
Transaction.prototype.getFormattedPrice = function() {
  return `GHS ${parseFloat(this.salePrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
};

// Instance method to get formatted commission
Transaction.prototype.getFormattedCommission = function() {
  return `GHS ${parseFloat(this.commissionAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
};

// Instance method to get commission percentage
Transaction.prototype.getCommissionPercentage = function() {
  return `${(parseFloat(this.commissionRate) * 100).toFixed(2)}%`;
};

// Instance method to calculate net amount (price - commission)
Transaction.prototype.getNetAmount = function() {
  const net = parseFloat(this.salePrice) - parseFloat(this.commissionAmount);
  return parseFloat(net.toFixed(2));
};

// Instance method to get formatted net amount
Transaction.prototype.getFormattedNetAmount = function() {
  return `GHS ${this.getNetAmount().toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
};

// Class method to get total sales
Transaction.getTotalSales = async function() {
  const result = await this.findAll({
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalTransactions'],
      [sequelize.fn('SUM', sequelize.col('salePrice')), 'totalRevenue'],
      [sequelize.fn('SUM', sequelize.col('commissionAmount')), 'totalCommission']
    ]
  });
  
  return {
    totalTransactions: parseInt(result[0].dataValues.totalTransactions) || 0,
    totalRevenue: parseFloat(result[0].dataValues.totalRevenue) || 0,
    totalCommission: parseFloat(result[0].dataValues.totalCommission) || 0
  };
};

// Class method to get transactions by date range
Transaction.getByDateRange = async function(startDate, endDate) {
  return await this.findAll({
    where: {
      transactionDate: {
        [sequelize.Sequelize.Op.between]: [startDate, endDate]
      }
    },
    order: [['transactionDate', 'DESC']]
  });
};

// Class method to get transactions by user
Transaction.getByUser = async function(userId) {
  return await this.findAll({
    where: { createdBy: userId },
    order: [['transactionDate', 'DESC']]
  });
};

export default Transaction;