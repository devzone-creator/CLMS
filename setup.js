import { testConnection, syncDatabase } from './config/db.js';
import AuthService from './services/authService.js';
import LandService from './services/landService.js';

console.log('🚀 Setting up CLMS Development Environment...\n');

async function setupDevelopment() {
  try {
    // Test database connection
    console.log('📊 Testing database connection...');
    const connectionSuccess = await testConnection();
    if (!connectionSuccess) {
      console.log('❌ Database connection failed');
      return;
    }

    // Sync database
    console.log('🔄 Synchronizing database...');
    await syncDatabase(true); // force: true to recreate tables
    console.log('✅ Database synchronized\n');

    // Create initial admin user
    console.log('👤 Creating initial admin user...');
    try {
      const adminUser = await AuthService.register({
        email: 'admin@gbewaa.com',
        password: 'AdminPass123',
        role: 'ADMIN',
        firstName: 'System',
        lastName: 'Administrator'
      });
      console.log('✅ Admin user created:', adminUser.email);
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Admin user already exists');
      } else {
        throw error;
      }
    }

    // Create sample staff user
    console.log('👥 Creating sample staff user...');
    try {
      const staffUser = await AuthService.register({
        email: 'staff@gbewaa.com',
        password: 'StaffPass123',
        role: 'STAFF',
        firstName: 'John',
        lastName: 'Staff'
      });
      console.log('✅ Staff user created:', staffUser.email);
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Staff user already exists');
      } else {
        throw error;
      }
    }

    // Create sample auditor user
    console.log('📊 Creating sample auditor user...');
    try {
      const auditorUser = await AuthService.register({
        email: 'auditor@gbewaa.com',
        password: 'AuditorPass123',
        role: 'AUDITOR',
        firstName: 'Jane',
        lastName: 'Auditor'
      });
      console.log('✅ Auditor user created:', auditorUser.email);
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Auditor user already exists');
      } else {
        throw error;
      }
    }

    // Create sample land plots
    console.log('\n🏞️  Creating sample land plots...');
    const samplePlots = [
      {
        plotNumber: 'GB001',
        location: 'Tamale North District',
        size: 2.5,
        sizeUnit: 'ACRES',
        ownerName: 'Gbewaa Palace',
        description: 'Prime residential land near main road'
      },
      {
        plotNumber: 'GB002',
        location: 'Tamale South District',
        size: 1.8,
        sizeUnit: 'HECTARES',
        ownerName: 'Gbewaa Palace',
        status: 'RESERVED',
        description: 'Commercial land with excellent access'
      },
      {
        plotNumber: 'GB003',
        location: 'Tamale Central District',
        size: 3000,
        sizeUnit: 'SQ_METERS',
        ownerName: 'Gbewaa Palace',
        description: 'Mixed-use development opportunity'
      }
    ];

    for (const plotData of samplePlots) {
      try {
        const plot = await LandService.createLandPlot(plotData);
        console.log(`✅ Created plot: ${plot.plotNumber} - ${plot.getFormattedSize()}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`ℹ️  Plot ${plotData.plotNumber} already exists`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n🎉 Development environment setup complete!');
    console.log('\n📋 Summary:');
    console.log('✅ Database connected and synchronized');
    console.log('✅ Sample users created (admin, staff, auditor)');
    console.log('✅ Sample land plots created');
    console.log('\n🚀 You can now start the server with: npm run dev');
    console.log('\n🔐 Login credentials:');
    console.log('   Admin: admin@gbewaa.com / AdminPass123');
    console.log('   Staff: staff@gbewaa.com / StaffPass123');
    console.log('   Auditor: auditor@gbewaa.com / AuditorPass123');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error(error);
  }

  process.exit(0);
}

setupDevelopment();