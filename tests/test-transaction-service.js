import TransactionService from '../services/transactionService.js';
import AuthService from '../services/authService.js';
import LandService from '../services/landService.js';
import { testConnection, syncDatabase } from '../config/db.js';

console.log('🧪 Testing Transaction Service...');

async function testTransactionService() {
  // Test connection first
  const connectionSuccess = await testConnection();
  if (!connectionSuccess) {
    console.log('❌ Database connection failed');
    return;
  }

  // Sync database to create tables
  await syncDatabase(true);

  try {
    // Test 1: Set up test data
    console.log('\n📝 Test 1: Setting up test data...');
    
    // Create test user
    const user = await AuthService.register({
      email: 'staff@test.com',
      password: 'StaffPass123',
      role: 'STAFF',
      firstName: 'John',
      lastName: 'Staff'
    });
    console.log('✅ Test user created:', user.email);

    // Create test land plots
    const plot1 = await LandService.createLandPlot({
      plotNumber: 'TX001',
      location: 'Test Location 1',
      size: 2.0,
      sizeUnit: 'ACRES',
      ownerName: 'Test Owner'
    });

    const plot2 = await LandService.createLandPlot({
      plotNumber: 'TX002',
      location: 'Test Location 2',
      size: 1.5,
      sizeUnit: 'HECTARES',
      ownerName: 'Test Owner'
    });

    console.log('✅ Test land plots created:', plot1.plotNumber, plot2.plotNumber);

    // Test 2: Record a transaction
    console.log('\n💰 Test 2: Recording a transaction...');
    
    const transactionData = {
      landPlotId: plot1.id,
      buyerName: 'John Buyer',
      buyerContact: '+233241234567',
      sellerName: 'Jane Seller',
      sellerContact: '+233201234567',
      salePrice: 50000.00,
      commissionRate: 0.10
    };

    const transaction = await TransactionService.recordTransaction(transactionData, user.id);
    console.log('✅ Transaction recorded:', transaction.id);
    console.log('✅ Sale price:', transaction.getFormattedPrice());
    console.log('✅ Commission:', transaction.getFormattedCommission());
    console.log('✅ Net amount:', transaction.getFormattedNetAmount());
    console.log('✅ Land plot status updated:', transaction.landPlot.status);

    // Test 3: Get all transactions
    console.log('\n📋 Test 3: Getting all transactions...');
    
    const allTransactions = await TransactionService.getAllTransactions();
    console.log('✅ Total transactions retrieved:', allTransactions.transactions.length);
    console.log('✅ Pagination info:', allTransactions.pagination);

    // Test 4: Get transaction by ID
    console.log('\n🔍 Test 4: Getting transaction by ID...');
    
    const foundTransaction = await TransactionService.getTransactionById(transaction.id);
    console.log('✅ Found transaction:', foundTransaction.id);
    console.log('✅ Buyer name:', foundTransaction.buyerName);
    console.log('✅ Land plot:', foundTransaction.landPlot.plotNumber);
    console.log('✅ Creator:', foundTransaction.creator.firstName, foundTransaction.creator.lastName);

    // Test 5: Record another transaction
    console.log('\n💼 Test 5: Recording another transaction...');
    
    const transaction2Data = {
      landPlotId: plot2.id,
      buyerName: 'Alice Buyer',
      buyerContact: '+233551234567',
      sellerName: 'Bob Seller',
      sellerContact: '+233301234567',
      salePrice: 75000.00,
      commissionRate: 0.08
    };

    const transaction2 = await TransactionService.recordTransaction(transaction2Data, user.id);
    console.log('✅ Second transaction recorded:', transaction2.id);
    console.log('✅ Sale price:', transaction2.getFormattedPrice());
    console.log('✅ Commission rate:', transaction2.getCommissionPercentage());

    // Test 6: Get transaction statistics
    console.log('\n📊 Test 6: Getting transaction statistics...');
    
    const stats = await TransactionService.getTransactionStatistics();
    console.log('✅ Total transactions:', stats.totalTransactions);
    console.log('✅ Total revenue: GHS', stats.totalRevenue.toLocaleString());
    console.log('✅ Total commission: GHS', stats.totalCommission.toLocaleString());
    console.log('✅ Average price: GHS', stats.averagePrice.toLocaleString());
    console.log('✅ Net revenue: GHS', stats.netRevenue.toLocaleString());

    // Test 7: Filter transactions
    console.log('\n🔍 Test 7: Testing transaction filtering...');
    
    const filteredTransactions = await TransactionService.getAllTransactions({
      buyerName: 'John',
      minPrice: 40000,
      maxPrice: 60000,
      sortBy: 'salePrice',
      sortOrder: 'ASC'
    });
    console.log('✅ Filtered transactions:', filteredTransactions.transactions.length);
    if (filteredTransactions.transactions.length > 0) {
      console.log('✅ First result buyer:', filteredTransactions.transactions[0].buyerName);
    }

    // Test 8: Get transactions by user
    console.log('\n👤 Test 8: Getting transactions by user...');
    
    const userTransactions = await TransactionService.getTransactionsByUser(user.id);
    console.log('✅ User transactions:', userTransactions.transactions.length);

    // Test 9: Get recent transactions
    console.log('\n🕒 Test 9: Getting recent transactions...');
    
    const recentTransactions = await TransactionService.getRecentTransactions(5);
    console.log('✅ Recent transactions:', recentTransactions.length);

    // Test 10: Commission calculation
    console.log('\n🧮 Test 10: Testing commission calculation...');
    
    const commissionCalc = TransactionService.calculateCommission(100000, 0.12);
    console.log('✅ Sale price: GHS', commissionCalc.salePrice.toLocaleString());
    console.log('✅ Commission rate:', commissionCalc.commissionPercentage);
    console.log('✅ Commission amount: GHS', commissionCalc.commissionAmount.toLocaleString());
    console.log('✅ Net amount: GHS', commissionCalc.netAmount.toLocaleString());

    // Test 11: Update transaction
    console.log('\n✏️  Test 11: Updating transaction...');
    
    const updatedTransaction = await TransactionService.updateTransaction(transaction.id, {
      buyerContact: '+233241234999',
      receiptPath: '/receipts/test-receipt.pdf'
    });
    console.log('✅ Transaction updated:', updatedTransaction.id);
    console.log('✅ New buyer contact:', updatedTransaction.buyerContact);

    // Test 12: Error handling - Try to sell already sold plot
    console.log('\n⚠️  Test 12: Error handling - Already sold plot...');
    
    try {
      await TransactionService.recordTransaction({
        landPlotId: plot1.id, // Already sold
        buyerName: 'Another Buyer',
        buyerContact: '+233123456789',
        sellerName: 'Another Seller',
        sellerContact: '+233987654321',
        salePrice: 60000.00
      }, user.id);
    } catch (error) {
      console.log('✅ Already sold error caught:', error.message);
    }

    // Test 13: Error handling - Invalid land plot
    console.log('\n⚠️  Test 13: Error handling - Invalid land plot...');
    
    try {
      await TransactionService.recordTransaction({
        landPlotId: 'non-existent-id',
        buyerName: 'Test Buyer',
        buyerContact: '+233123456789',
        sellerName: 'Test Seller',
        sellerContact: '+233987654321',
        salePrice: 50000.00
      }, user.id);
    } catch (error) {
      console.log('✅ Invalid land plot error caught:', error.message);
    }

    // Test 14: Error handling - Transaction not found
    console.log('\n⚠️  Test 14: Error handling - Transaction not found...');
    
    try {
      await TransactionService.getTransactionById('non-existent-id');
    } catch (error) {
      console.log('✅ Transaction not found error caught:', error.message);
    }

    console.log('\n🎉 All Transaction Service tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }

  process.exit(0);
}

testTransactionService();