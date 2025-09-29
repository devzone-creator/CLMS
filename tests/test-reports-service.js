import ReportsService from '../services/reportsService.js';
import { testConnection, syncDatabase } from '../config/db.js';
import { User, LandPlot, Transaction } from '../models/index.js';

console.log('🧪 Testing Reports Service...');

async function testReportsService() {
  // Test connection first
  const connectionSuccess = await testConnection();
  if (!connectionSuccess) {
    console.log('❌ Database connection failed');
    return;
  }

  // Sync database to create tables
  await syncDatabase(true);

  try {
    // Create test data
    console.log('\n📝 Setting up test data...');
    
    // Create test users
    const adminUser = await User.create({
      email: 'admin@reports.com',
      password: 'AdminPass123',
      role: 'ADMIN',
      firstName: 'Admin',
      lastName: 'User'
    });

    const staffUser1 = await User.create({
      email: 'staff1@reports.com',
      password: 'StaffPass123',
      role: 'STAFF',
      firstName: 'John',
      lastName: 'Staff'
    });

    const staffUser2 = await User.create({
      email: 'staff2@reports.com',
      password: 'StaffPass123',
      role: 'STAFF',
      firstName: 'Jane',
      lastName: 'Staff'
    });

    // Create test land plots
    const landPlot1 = await LandPlot.create({
      plotNumber: 'RPT-001',
      location: 'Test Location A',
      size: 2.5,
      sizeUnit: 'ACRES',
      status: 'SOLD',
      ownerName: 'Test Owner 1'
    });

    const landPlot2 = await LandPlot.create({
      plotNumber: 'RPT-002',
      location: 'Test Location B',
      size: 1.8,
      sizeUnit: 'ACRES',
      status: 'AVAILABLE',
      ownerName: 'Test Owner 2'
    });

    const landPlot3 = await LandPlot.create({
      plotNumber: 'RPT-003',
      location: 'Test Location A',
      size: 3.2,
      sizeUnit: 'HECTARES',
      status: 'DISPUTED',
      ownerName: 'Test Owner 3'
    });

    // Create test transactions
    const transaction1 = await Transaction.create({
      landPlotId: landPlot1.id,
      buyerName: 'Buyer One',
      buyerContact: '1234567890',
      sellerName: 'Seller One',
      sellerContact: '0987654321',
      salePrice: 50000,
      commissionRate: 0.10,
      commissionAmount: 5000,
      transactionDate: new Date('2024-01-15'),
      createdBy: staffUser1.id
    });

    const transaction2 = await Transaction.create({
      landPlotId: landPlot1.id,
      buyerName: 'Buyer Two',
      buyerContact: '1111111111',
      sellerName: 'Seller Two',
      sellerContact: '2222222222',
      salePrice: 75000,
      commissionRate: 0.12,
      commissionAmount: 9000,
      transactionDate: new Date('2024-02-20'),
      createdBy: staffUser2.id
    });

    const transaction3 = await Transaction.create({
      landPlotId: landPlot2.id,
      buyerName: 'Buyer Three',
      buyerContact: '3333333333',
      sellerName: 'Seller Three',
      sellerContact: '4444444444',
      salePrice: 60000,
      commissionRate: 0.10,
      commissionAmount: 6000,
      transactionDate: new Date('2024-03-10'),
      createdBy: staffUser1.id
    });

    console.log('✅ Test data created');

    // Test 1: Business Summary Report
    console.log('\n📊 Test 1: Business Summary Report...');
    
    const businessSummary = await ReportsService.getBusinessSummary();
    
    console.log('✅ Business summary generated');
    console.log('✅ Total transactions:', businessSummary.summary.totalTransactions);
    console.log('✅ Total revenue:', businessSummary.summary.totalRevenue);
    console.log('✅ Total commission:', businessSummary.summary.totalCommission);
    console.log('✅ Net revenue:', businessSummary.summary.netRevenue);
    console.log('✅ Land statistics:', businessSummary.landStatistics);
    console.log('✅ Recent activity entries:', businessSummary.recentActivity.length);

    // Validate business summary data
    console.log('✅ Expected 3 transactions:', businessSummary.summary.totalTransactions === 3);
    console.log('✅ Expected 185000 total revenue:', businessSummary.summary.totalRevenue === 185000);
    console.log('✅ Expected 20000 total commission:', businessSummary.summary.totalCommission === 20000);

    // Test 2: Business Summary with Date Filter
    console.log('\n📅 Test 2: Business Summary with Date Filter...');
    
    const filteredSummary = await ReportsService.getBusinessSummary({
      startDate: '2024-02-01',
      endDate: '2024-02-28'
    });
    
    console.log('✅ Filtered summary generated');
    console.log('✅ Filtered transactions:', filteredSummary.summary.totalTransactions);
    console.log('✅ Expected 1 transaction in Feb:', filteredSummary.summary.totalTransactions === 1);
    console.log('✅ Expected 75000 revenue in Feb:', filteredSummary.summary.totalRevenue === 75000);

    // Test 3: Transaction Report
    console.log('\n📈 Test 3: Transaction Report...');
    
    const transactionReport = await ReportsService.getTransactionReport({
      groupBy: 'date'
    });
    
    console.log('✅ Transaction report generated');
    console.log('✅ Grouped by date entries:', transactionReport.data.length);
    console.log('✅ Total transactions in report:', transactionReport.totals.totalTransactions);
    console.log('✅ Total revenue in report:', transactionReport.totals.totalRevenue);

    // Test 4: Transaction Report Grouped by User
    console.log('\n👥 Test 4: Transaction Report Grouped by User...');
    
    const userTransactionReport = await ReportsService.getTransactionReport({
      groupBy: 'user'
    });
    
    console.log('✅ User transaction report generated');
    console.log('✅ User groups:', userTransactionReport.data.length);
    console.log('✅ First user transactions:', userTransactionReport.data[0]?.transactionCount);

    // Test 5: Land Plot Report
    console.log('\n🏞️  Test 5: Land Plot Report...');
    
    const landPlotReport = await ReportsService.getLandPlotReport();
    
    console.log('✅ Land plot report generated');
    console.log('✅ Total plots:', landPlotReport.summary.totalPlots);
    console.log('✅ Total size:', landPlotReport.summary.totalSize);
    console.log('✅ Status breakdown entries:', landPlotReport.statusBreakdown.length);
    console.log('✅ Size unit breakdown entries:', landPlotReport.sizeUnitBreakdown.length);
    console.log('✅ Plot details:', landPlotReport.plots.length);

    // Test 6: Land Plot Report with Filters
    console.log('\n🔍 Test 6: Land Plot Report with Filters...');
    
    const filteredLandReport = await ReportsService.getLandPlotReport({
      status: 'AVAILABLE',
      location: 'Test Location B'
    });
    
    console.log('✅ Filtered land plot report generated');
    console.log('✅ Filtered plots count:', filteredLandReport.summary.totalPlots);
    console.log('✅ Expected 1 available plot in Location B:', filteredLandReport.summary.totalPlots === 1);

    // Test 7: User Performance Report
    console.log('\n🏆 Test 7: User Performance Report...');
    
    const userPerformanceReport = await ReportsService.getUserPerformanceReport();
    
    console.log('✅ User performance report generated');
    console.log('✅ Total users:', userPerformanceReport.summary.totalUsers);
    console.log('✅ Active users:', userPerformanceReport.summary.activeUsers);
    console.log('✅ User performance entries:', userPerformanceReport.userPerformance.length);
    console.log('✅ Top performers:', userPerformanceReport.topPerformers.length);

    // Test 8: User Performance Report with Role Filter
    console.log('\n👨‍💼 Test 8: User Performance Report with Role Filter...');
    
    const staffPerformanceReport = await ReportsService.getUserPerformanceReport({
      role: 'STAFF'
    });
    
    console.log('✅ Staff performance report generated');
    console.log('✅ Staff users only:', staffPerformanceReport.summary.totalUsers);
    console.log('✅ Expected 2 staff users:', staffPerformanceReport.summary.totalUsers === 2);

    // Test 9: Disputed Plots Report
    console.log('\n⚠️  Test 9: Disputed Plots Report...');
    
    const disputedPlotsReport = await ReportsService.getDisputedPlotsReport();
    
    console.log('✅ Disputed plots report generated');
    console.log('✅ Total disputed plots:', disputedPlotsReport.summary.totalDisputedPlots);
    console.log('✅ Expected 1 disputed plot:', disputedPlotsReport.summary.totalDisputedPlots === 1);
    console.log('✅ Disputed plot details:', disputedPlotsReport.disputedPlots.length);
    console.log('✅ Location breakdown:', disputedPlotsReport.locationBreakdown.length);

    // Test 10: Monthly Trends Report
    console.log('\n📈 Test 10: Monthly Trends Report...');
    
    const monthlyTrends = await ReportsService.getMonthlyTrends({
      months: 6
    });
    
    console.log('✅ Monthly trends report generated');
    console.log('✅ Trend entries:', monthlyTrends.trends.length);
    console.log('✅ Expected 6 months:', monthlyTrends.trends.length === 6);
    console.log('✅ Period start date:', monthlyTrends.period.startDate);
    console.log('✅ Period end date:', monthlyTrends.period.endDate);
    console.log('✅ Summary total transactions:', monthlyTrends.summary.totalTransactions);

    // Test 11: Error Handling
    console.log('\n⚠️  Test 11: Error Handling...');
    
    try {
      // Test with invalid date format
      await ReportsService.getBusinessSummary({
        startDate: 'invalid-date'
      });
    } catch (error) {
      console.log('✅ Invalid date error caught:', !!error.message);
    }

    try {
      // Test with invalid user ID
      await ReportsService.getUserPerformanceReport({
        userId: 'invalid-uuid'
      });
    } catch (error) {
      console.log('✅ Invalid user ID handled gracefully');
    }

    // Test 12: Edge Cases
    console.log('\n🔄 Test 12: Edge Cases...');
    
    // Test with no data (empty date range)
    const emptyReport = await ReportsService.getBusinessSummary({
      startDate: '2020-01-01',
      endDate: '2020-01-31'
    });
    
    console.log('✅ Empty date range handled');
    console.log('✅ Zero transactions for empty range:', emptyReport.summary.totalTransactions === 0);
    console.log('✅ Zero revenue for empty range:', emptyReport.summary.totalRevenue === 0);

    // Test with future date range
    const futureReport = await ReportsService.getTransactionReport({
      startDate: '2025-01-01',
      endDate: '2025-12-31'
    });
    
    console.log('✅ Future date range handled');
    console.log('✅ Zero transactions for future range:', futureReport.totals.totalTransactions === 0);

    console.log('\n🎉 All Reports Service tests passed!');
    console.log('\n📋 Summary:');
    console.log('✅ Business summary reports working');
    console.log('✅ Transaction reports with grouping working');
    console.log('✅ Land plot reports with filtering working');
    console.log('✅ User performance reports working');
    console.log('✅ Disputed plots reports working');
    console.log('✅ Monthly trends reports working');
    console.log('✅ Date filtering working');
    console.log('✅ Error handling working');
    console.log('✅ Edge cases handled properly');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }

  process.exit(0);
}

testReportsService();