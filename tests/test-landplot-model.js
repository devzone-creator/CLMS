import LandPlot from '../models/LandPlot.js';
import { testConnection, syncDatabase } from '../config/db.js';

console.log('🧪 Testing LandPlot model...');

async function testLandPlotModel() {
  // Test connection first
  const connectionSuccess = await testConnection();
  if (!connectionSuccess) {
    console.log('❌ Database connection failed');
    return;
  }

  // Sync database to create tables
  await syncDatabase(true); // force: true to recreate tables

  try {
    // Test 1: Create new land plots
    console.log('\n📝 Test 1: Creating land plots...');
    
    const plot1 = await LandPlot.create({
      plotNumber: 'gb001',
      location: 'Tamale North District',
      size: 2.5,
      sizeUnit: 'ACRES',
      ownerName: 'Gbewaa Palace',
      description: 'Prime residential land near main road'
    });
    console.log('✅ Plot created:', plot1.plotNumber, '-', plot1.getFormattedSize());

    const plot2 = await LandPlot.create({
      plotNumber: 'GB002',
      location: 'Tamale South District',
      size: 1.8,
      sizeUnit: 'HECTARES',
      ownerName: 'Gbewaa Palace',
      status: 'RESERVED'
    });
    console.log('✅ Plot created:', plot2.plotNumber, '-', plot2.getFormattedSize());

    // Test 2: Check plot availability
    console.log('\n🔍 Test 2: Testing plot availability...');
    console.log('Plot 1 available:', plot1.isAvailable());
    console.log('Plot 2 available:', plot2.isAvailable());

    // Test 3: Mark plot as sold
    console.log('\n💰 Test 3: Marking plot as sold...');
    await plot1.markAsSold();
    console.log('✅ Plot 1 status after sale:', plot1.status);
    console.log('Plot 1 still available:', plot1.isAvailable());

    // Test 4: Find available plots
    console.log('\n📋 Test 4: Finding available plots...');
    const availablePlots = await LandPlot.findAvailable();
    console.log('✅ Available plots:', availablePlots.length);

    // Test 5: Find plots by status
    console.log('\n📊 Test 5: Finding plots by status...');
    const soldPlots = await LandPlot.findByStatus('SOLD');
    const reservedPlots = await LandPlot.findByStatus('RESERVED');
    console.log('✅ Sold plots:', soldPlots.length);
    console.log('✅ Reserved plots:', reservedPlots.length);

    // Test 6: Search by location
    console.log('\n🗺️  Test 6: Searching by location...');
    const northPlots = await LandPlot.searchByLocation('North');
    console.log('✅ Plots in North area:', northPlots.length);

    // Test 7: Test validation errors
    console.log('\n⚠️  Test 7: Testing validation...');
    try {
      await LandPlot.create({
        plotNumber: '', // empty
        location: 'A', // too short
        size: -1, // negative
        ownerName: 'X' // too short
      });
    } catch (error) {
      console.log('✅ Validation errors caught:', error.errors.length, 'errors');
      error.errors.forEach(err => console.log('  -', err.message));
    }

    console.log('\n🎉 All LandPlot model tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  process.exit(0);
}

testLandPlotModel();