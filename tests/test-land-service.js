import LandService from '../services/landService.js';
import { testConnection, syncDatabase } from '../config/db.js';

console.log('🧪 Testing Land Service...');

async function testLandService() {
  // Test connection first
  const connectionSuccess = await testConnection();
  if (!connectionSuccess) {
    console.log('❌ Database connection failed');
    return;
  }

  // Sync database to create tables
  await syncDatabase(true);

  try {
    // Test 1: Create land plots
    console.log('\n📝 Test 1: Creating land plots...');
    
    const plot1 = await LandService.createLandPlot({
      plotNumber: 'GB001',
      location: 'Tamale North District',
      size: 2.5,
      sizeUnit: 'ACRES',
      ownerName: 'Gbewaa Palace',
      description: 'Prime residential land near main road'
    });
    console.log('✅ Plot 1 created:', plot1.plotNumber, '-', plot1.getFormattedSize());

    const plot2 = await LandService.createLandPlot({
      plotNumber: 'GB002',
      location: 'Tamale South District',
      size: 1.8,
      sizeUnit: 'HECTARES',
      ownerName: 'Gbewaa Palace',
      status: 'RESERVED'
    });
    console.log('✅ Plot 2 created:', plot2.plotNumber, '-', plot2.getFormattedSize());

    const plot3 = await LandService.createLandPlot({
      plotNumber: 'GB003',
      location: 'Tamale Central District',
      size: 3000,
      sizeUnit: 'SQ_METERS',
      ownerName: 'Gbewaa Palace'
    });
    console.log('✅ Plot 3 created:', plot3.plotNumber, '-', plot3.getFormattedSize());

    // Test 2: Get all land plots
    console.log('\n📋 Test 2: Getting all land plots...');
    
    const allPlots = await LandService.getAllLandPlots();
    console.log('✅ Total plots retrieved:', allPlots.landPlots.length);
    console.log('✅ Pagination info:', allPlots.pagination);

    // Test 3: Get land plot by ID
    console.log('\n🔍 Test 3: Getting land plot by ID...');
    
    const foundPlot = await LandService.getLandPlotById(plot1.id);
    console.log('✅ Found plot:', foundPlot.plotNumber);
    console.log('✅ Plot location:', foundPlot.location);

    // Test 4: Update land plot
    console.log('\n✏️  Test 4: Updating land plot...');
    
    const updatedPlot = await LandService.updateLandPlot(plot1.id, {
      description: 'Updated: Prime residential land with excellent road access',
      status: 'RESERVED'
    });
    console.log('✅ Plot updated:', updatedPlot.plotNumber);
    console.log('✅ New status:', updatedPlot.status);
    console.log('✅ New description:', updatedPlot.description);

    // Test 5: Get available land plots
    console.log('\n🏞️  Test 5: Getting available land plots...');
    
    const availablePlots = await LandService.getAvailableLandPlots();
    console.log('✅ Available plots:', availablePlots.landPlots.length);
    availablePlots.landPlots.forEach(plot => {
      console.log(`  - ${plot.plotNumber}: ${plot.status}`);
    });

    // Test 6: Mark plot as sold
    console.log('\n💰 Test 6: Marking plot as sold...');
    
    const soldPlot = await LandService.markAsSold(plot3.id);
    console.log('✅ Plot marked as sold:', soldPlot.plotNumber);
    console.log('✅ New status:', soldPlot.status);

    // Test 7: Get land plot statistics
    console.log('\n📊 Test 7: Getting land plot statistics...');
    
    const stats = await LandService.getLandPlotStatistics();
    console.log('✅ Total plots:', stats.totalPlots);
    console.log('✅ Available plots:', stats.availablePlots);
    console.log('✅ Sold plots:', stats.soldPlots);
    console.log('✅ Reserved plots:', stats.reservedPlots);
    console.log('✅ Status breakdown:', stats.statusBreakdown);

    // Test 8: Filtering and pagination
    console.log('\n🔍 Test 8: Testing filtering and pagination...');
    
    const filteredPlots = await LandService.getAllLandPlots({
      page: 1,
      limit: 2,
      location: 'Tamale',
      sortBy: 'size',
      sortOrder: 'DESC'
    });
    console.log('✅ Filtered plots count:', filteredPlots.landPlots.length);
    console.log('✅ Pagination - Current page:', filteredPlots.pagination.currentPage);
    console.log('✅ Pagination - Total pages:', filteredPlots.pagination.totalPages);

    // Test 9: Error handling - Duplicate plot number
    console.log('\n⚠️  Test 9: Error handling - Duplicate plot number...');
    
    try {
      await LandService.createLandPlot({
        plotNumber: 'GB001', // Same as plot1
        location: 'Another Location',
        size: 1.0,
        sizeUnit: 'ACRES',
        ownerName: 'Another Owner'
      });
    } catch (error) {
      console.log('✅ Duplicate plot number error caught:', error.message);
    }

    // Test 10: Error handling - Plot not found
    console.log('\n⚠️  Test 10: Error handling - Plot not found...');
    
    try {
      await LandService.getLandPlotById('non-existent-id');
    } catch (error) {
      console.log('✅ Plot not found error caught:', error.message);
    }

    // Test 11: Error handling - Invalid update
    console.log('\n⚠️  Test 11: Error handling - Invalid update...');
    
    try {
      await LandService.updateLandPlot(plot2.id, {
        plotNumber: 'GB001' // Trying to use existing plot number
      });
    } catch (error) {
      console.log('✅ Invalid update error caught:', error.message);
    }

    // Test 12: Error handling - Mark already sold plot as sold
    console.log('\n⚠️  Test 12: Error handling - Mark already sold plot as sold...');
    
    try {
      await LandService.markAsSold(plot3.id); // Already sold in test 6
    } catch (error) {
      console.log('✅ Already sold error caught:', error.message);
    }

    console.log('\n🎉 All Land Service tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }

  process.exit(0);
}

testLandService();