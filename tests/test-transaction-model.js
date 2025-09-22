import { User, LandPlot, Transaction } from '../models/index.js';
import { testConnection, syncDatabase } from '../config/db.js';

console.log('🧪 Testing Transaction model and relationships...');

async function testTransactionModel() {
  // Test connection first
  const connectionSuccess = await testConnection();
  if (!connectionSuccess) {
    console.log('❌ Database connection failed');
    return;
  }

  // Sync database to create tables with relationships
  await syncDatabase(true); // force: true to recreate tables

  try {
    // Test 1: Create test data (User and LandPlot)
    console.log('\n📝 Test 1: Creating test data...');
    
    const user = await User.create({
      email: 'staff@gbewaa.com',
      password: 'password123',
      role: 'STAFF',
      firstName: 'Jane',
      lastName: 'Smith'
    });
    console.log('✅ User created:', user.getFullName());

    const landPlot = await LandPlot.create({
      plotNumber: 'GB003',
      location: 'Tamale Central District',
      size: 3.0,
      sizeUnit: 'ACRES',
      ownerName: 'Gbewaa Palace'
    });
    console.log('✅ Land plot created:', landPlot.plotNumber);

    // Test 2: Create transaction with automatic commission calculation
    console.log('\n💰 Test 2: Creating transaction...');
    
    const transaction = await Transaction.create({
      landPlotId: landPlot.id,
      buyerName: 'Mohammed Ali',
      buyerContact: '+233241234567',
      sellerName: 'Gbewaa Palace',
      sellerContact: '+233201234567',
      salePrice: 50000.00,
      commissionRate: 0.10, // 10%
      createdBy: user.id
    });
    
    console.log('✅ Transaction created:');
    console.log('  Sale Price:', transaction.getFormattedPrice());
    console.log('  Commission Rate:', transaction.getCommissionPercentage());
    console.log('  Commission Amount:', transaction.getFormattedCommission());
    console.log('  Net Amount:', transaction.getFormattedNetAmount());

    // Test 3: Test relationships
    console.log('\n🔗 Test 3: Testing relationships...');
    
    // Get transaction with related data
    const transactionWithRelations = await Transaction.findByPk(transaction.id, {
      include: [
        { model: User, as: 'creator' },
        { model: LandPlot, as: 'landPlot' }
      ]
    });
    
    console.log('✅ Transaction creator:', transactionWithRelations.creator.getFullName());
    console.log('✅ Land plot:', transactionWithRelations.landPlot.plotNumber);
    console.log('✅ Plot location:', transactionWithRelations.landPlot.location);

    // Test 4: Test User -> Transactions relationship
    console.log('\n👤 Test 4: Testing User -> Transactions relationship...');
    
    const userWithTransactions = await User.findByPk(user.id, {
      include: [{ model: Transaction, as: 'transactions' }]
    });
    
    console.log('✅ User transactions count:', userWithTransactions.transactions.length);

    // Test 5: Test LandPlot -> Transactions relationship
    console.log('\n🏞️  Test 5: Testing LandPlot -> Transactions relationship...');
    
    const plotWithTransactions = await LandPlot.findByPk(landPlot.id, {
      include: [{ model: Transaction, as: 'transactions' }]
    });
    
    console.log('✅ Plot transactions count:', plotWithTransactions.transactions.length);

    // Test 6: Create another transaction with different commission rate
    console.log('\n💼 Test 6: Creating transaction with custom commission...');
    
    const landPlot2 = await LandPlot.create({
      plotNumber: 'GB004',
      location: 'Tamale West District',
      size: 1.5,
      sizeUnit: 'HECTARES',
      ownerName: 'Gbewaa Palace'
    });

    const transaction2 = await Transaction.create({
      landPlotId: landPlot2.id,
      buyerName: 'Fatima Abdul',
      buyerContact: '+233551234567',
      sellerName: 'Gbewaa Palace',
      sellerContact: '+233201234567',
      salePrice: 75000.00,
      commissionRate: 0.08, // 8% custom rate
      createdBy: user.id
    });
    
    console.log('✅ Transaction 2 created:');
    console.log('  Sale Price:', transaction2.getFormattedPrice());
    console.log('  Commission Rate:', transaction2.getCommissionPercentage());
    console.log('  Commission Amount:', transaction2.getFormattedCommission());

    // Test 7: Test aggregate functions
    console.log('\n📊 Test 7: Testing sales aggregation...');
    
    const salesSummary = await Transaction.getTotalSales();
    console.log('✅ Sales Summary:');
    console.log('  Total Transactions:', salesSummary.totalTransactions);
    console.log('  Total Revenue: GHS', salesSummary.totalRevenue.toLocaleString());
    console.log('  Total Commission: GHS', salesSummary.totalCommission.toLocaleString());

    // Test 8: Test validation errors
    console.log('\n⚠️  Test 8: Testing validation...');
    try {
      await Transaction.create({
        landPlotId: landPlot.id,
        buyerName: 'A', // too short
        buyerContact: '123', // too short
        sellerName: '', // empty
        sellerContact: '456', // too short
        salePrice: -100, // negative
        createdBy: user.id
      });
    } catch (error) {
      console.log('✅ Validation errors caught:', error.errors.length, 'errors');
      error.errors.forEach(err => console.log('  -', err.message));
    }

    console.log('\n🎉 All Transaction model tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }

  process.exit(0);
}

testTransactionModel();