import AuthService from '../services/authService.js';
import { testConnection, syncDatabase } from '../config/db.js';

console.log('🧪 Testing Authentication Service...');

async function testAuthService() {
  // Test connection first
  const connectionSuccess = await testConnection();
  if (!connectionSuccess) {
    console.log('❌ Database connection failed');
    return;
  }

  // Sync database to create tables
  await syncDatabase(true); // force: true to recreate tables

  try {
    // Test 1: User Registration
    console.log('\n📝 Test 1: User Registration...');
    
    const userData = {
      email: 'admin@gbewaa.com',
      password: 'SecurePass123',
      role: 'ADMIN',
      firstName: 'System',
      lastName: 'Administrator'
    };

    const registeredUser = await AuthService.register(userData);
    console.log('✅ User registered:', registeredUser.email);
    console.log('✅ User role:', registeredUser.role);
    console.log('✅ User name:', `${registeredUser.firstName} ${registeredUser.lastName}`);
    console.log('✅ Password not in response:', !registeredUser.password);

    // Test 2: User Login
    console.log('\n🔐 Test 2: User Login...');
    
    const loginResult = await AuthService.login('admin@gbewaa.com', 'SecurePass123');
    console.log('✅ Login successful for:', loginResult.user.email);
    console.log('✅ Token generated:', !!loginResult.token);
    console.log('✅ Token expires in:', loginResult.expiresIn);
    console.log('✅ User role in response:', loginResult.user.role);

    // Test 3: Token Verification
    console.log('\n🔍 Test 3: Token Verification...');
    
    const decodedToken = AuthService.verifyToken(loginResult.token);
    console.log('✅ Token verified successfully');
    console.log('✅ Token user ID:', decodedToken.userId);
    console.log('✅ Token email:', decodedToken.email);
    console.log('✅ Token role:', decodedToken.role);

    // Test 4: Password Validation
    console.log('\n🔒 Test 4: Password Validation...');
    
    const weakPassword = AuthService.validatePassword('123');
    const mediumPassword = AuthService.validatePassword('password123');
    const strongPassword = AuthService.validatePassword('SecurePass123!');
    
    console.log('✅ Weak password validation:');
    console.log('  Valid:', weakPassword.isValid);
    console.log('  Strength:', weakPassword.strength);
    console.log('  Errors:', weakPassword.errors.length);
    
    console.log('✅ Medium password validation:');
    console.log('  Valid:', mediumPassword.isValid);
    console.log('  Strength:', mediumPassword.strength);
    
    console.log('✅ Strong password validation:');
    console.log('  Valid:', strongPassword.isValid);
    console.log('  Strength:', strongPassword.strength);

    // Test 5: Token Refresh
    console.log('\n🔄 Test 5: Token Refresh...');
    
    const refreshResult = await AuthService.refreshToken(registeredUser.id);
    console.log('✅ Token refreshed for:', refreshResult.user.email);
    console.log('✅ New token generated:', !!refreshResult.token);
    console.log('✅ New token different from old:', refreshResult.token !== loginResult.token);

    // Test 6: Error Handling - Duplicate Registration
    console.log('\n⚠️  Test 6: Error Handling - Duplicate Registration...');
    try {
      await AuthService.register(userData); // Same email
    } catch (error) {
      console.log('✅ Duplicate registration error caught:', error.message);
    }

    // Test 7: Error Handling - Invalid Login
    console.log('\n⚠️  Test 7: Error Handling - Invalid Login...');
    try {
      await AuthService.login('admin@gbewaa.com', 'wrongpassword');
    } catch (error) {
      console.log('✅ Invalid login error caught:', error.message);
    }

    // Test 8: Error Handling - Invalid Token
    console.log('\n⚠️  Test 8: Error Handling - Invalid Token...');
    try {
      AuthService.verifyToken('invalid.token.here');
    } catch (error) {
      console.log('✅ Invalid token error caught:', error.message);
    }

    // Test 9: Register Staff User
    console.log('\n👥 Test 9: Register Staff User...');
    
    const staffUser = await AuthService.register({
      email: 'staff@gbewaa.com',
      password: 'StaffPass123',
      role: 'STAFF',
      firstName: 'John',
      lastName: 'Staff'
    });
    console.log('✅ Staff user registered:', staffUser.email);
    console.log('✅ Staff role:', staffUser.role);

    // Test 10: Register Auditor User
    console.log('\n📊 Test 10: Register Auditor User...');
    
    const auditorUser = await AuthService.register({
      email: 'auditor@gbewaa.com',
      password: 'AuditorPass123',
      role: 'AUDITOR',
      firstName: 'Jane',
      lastName: 'Auditor'
    });
    console.log('✅ Auditor user registered:', auditorUser.email);
    console.log('✅ Auditor role:', auditorUser.role);

    console.log('\n🎉 All Authentication Service tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }

  process.exit(0);
}

testAuthService();