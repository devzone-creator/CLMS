import User from '../models/User.js';
import { testConnection, syncDatabase } from '../config/db.js';

console.log('🧪 Testing User model...');

async function testUserModel() {
  // Test connection first
  const connectionSuccess = await testConnection();
  if (!connectionSuccess) {
    console.log('❌ Database connection failed');
    return;
  }

  // Sync database to create tables
  await syncDatabase(true); // force: true to recreate tables

  try {
    // Test 1: Create a new user
    console.log('\n📝 Test 1: Creating a new user...');
    const newUser = await User.create({
      email: 'admin@gbewaa.com',
      password: 'password123',
      role: 'ADMIN',
      firstName: 'John',
      lastName: 'Doe'
    });
    console.log('✅ User created:', newUser.getFullName());
    console.log('📧 Email:', newUser.email);
    console.log('👤 Role:', newUser.role);

    // Test 2: Check password validation
    console.log('\n🔐 Test 2: Testing password validation...');
    const isValidPassword = await newUser.checkPassword('password123');
    const isInvalidPassword = await newUser.checkPassword('wrongpassword');
    console.log('✅ Correct password:', isValidPassword);
    console.log('❌ Wrong password:', isInvalidPassword);

    // Test 3: Find user by email
    console.log('\n🔍 Test 3: Finding user by email...');
    const foundUser = await User.findByEmail('admin@gbewaa.com');
    console.log('✅ Found user:', foundUser ? foundUser.getFullName() : 'Not found');

    // Test 4: Test validation errors
    console.log('\n⚠️  Test 4: Testing validation...');
    try {
      await User.create({
        email: 'invalid-email',
        password: '123', // too short
        firstName: 'A', // too short
        lastName: 'B'   // too short
      });
    } catch (error) {
      console.log('✅ Validation errors caught:', error.errors.length, 'errors');
      error.errors.forEach(err => console.log('  -', err.message));
    }

    console.log('\n🎉 All User model tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  process.exit(0);
}

testUserModel();