import User from './User.js';
import LandPlot from './LandPlot.js';
import Transaction from './Transaction.js';

// Define relationships

// User -> Transactions (One-to-Many)
User.hasMany(Transaction, {
  foreignKey: 'createdBy',
  as: 'transactions'
});

Transaction.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator'
});

// LandPlot -> Transactions (One-to-Many)
LandPlot.hasMany(Transaction, {
  foreignKey: 'landPlotId',
  as: 'transactions'
});

Transaction.belongsTo(LandPlot, {
  foreignKey: 'landPlotId',
  as: 'landPlot'
});

export { User, LandPlot, Transaction };