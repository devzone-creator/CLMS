import { testConnection, syncDatabase } from '../config/db.js';

console.log('🔍 Testing database connection...');

async function testDatabase() {
  // Test connection
  const connectionSuccess = await testConnection();
  
  if (connectionSuccess) {
    console.log('🔄 Testing database sync...');
    const syncSuccess = await syncDatabase();
    
    if (syncSuccess) {
      console.log('🎉 Database setup complete!');
      console.log('📁 Database file: ./database.sqlite');
    }
  }
  
  process.exit(0);
}

testDatabase();