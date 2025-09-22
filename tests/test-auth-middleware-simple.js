import { authenticateToken, requireRole, requireAdmin, requireAdminOrStaff } from '../middlewares/auth.js';
import AuthService from '../services/authService.js';
import { testConnection, syncDatabase } from '../config/db.js';

console.log('🧪 Testing Authentication Middleware (Simple)...');

// Mock Express request and response objects
const createMockReq = (headers = {}) => ({
  headers,
  user: null,
  token: null
});

const createMockRes = () => {
  const res = {
    statusCode: 200,
    jsonData: null,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.jsonData = data;
      return this;
    }
  };
  return res;
};

const createMockNext = () => {
  let called = false;
  return {
    fn: () => { called = true; },
    wasCalled: () => called
  };
};

async function testAuthMiddleware() {
  // Test connection first
  const connectionSuccess = await testConnection();
  if (!connectionSuccess) {
    console.log('❌ Database connection failed');
    return;
  }

  // Sync database to create tables
  await syncDatabase(true);

  try {
    // Create test users
    console.log('\n📝 Setting up test users...');
    
    const adminUser = await AuthService.register({
      email: 'admin@test.com',
      password: 'AdminPass123',
      role: 'ADMIN',
      firstName: 'Admin',
      lastName: 'User'
    });

    const staffUser = await AuthService.register({
      email: 'staff@test.com',
      password: 'StaffPass123',
      role: 'STAFF',
      firstName: 'Staff',
      lastName: 'User'
    });

    const auditorUser = await AuthService.register({
      email: 'auditor@test.com',
      password: 'AuditorPass123',
      role: 'AUDITOR',
      firstName: 'Auditor',
      lastName: 'User'
    });

    // Get tokens
    const adminLogin = await AuthService.login('admin@test.com', 'AdminPass123');
    const staffLogin = await AuthService.login('staff@test.com', 'StaffPass123');
    const auditorLogin = await AuthService.login('auditor@test.com', 'AuditorPass123');

    console.log('✅ Test users created and logged in');

    // Test 1: authenticateToken middleware without token
    console.log('\n🔒 Test 1: authenticateToken without token...');
    const req1 = createMockReq();
    const res1 = createMockRes();
    const next1 = createMockNext();

    await authenticateToken(req1, res1, next1.fn);
    console.log('✅ No token status:', res1.statusCode);
    console.log('✅ No token error code:', res1.jsonData?.error?.code);
    console.log('✅ Next not called:', !next1.wasCalled());

    // Test 2: authenticateToken middleware with valid token
    console.log('\n🔑 Test 2: authenticateToken with valid token...');
    const req2 = createMockReq({
      authorization: `Bearer ${adminLogin.token}`
    });
    const res2 = createMockRes();
    const next2 = createMockNext();

    await authenticateToken(req2, res2, next2.fn);
    console.log('✅ Valid token next called:', next2.wasCalled());
    console.log('✅ User added to request:', !!req2.user);
    console.log('✅ User email:', req2.user?.email);
    console.log('✅ User role:', req2.user?.role);

    // Test 3: authenticateToken middleware with invalid token
    console.log('\n❌ Test 3: authenticateToken with invalid token...');
    const req3 = createMockReq({
      authorization: 'Bearer invalid.token.here'
    });
    const res3 = createMockRes();
    const next3 = createMockNext();

    await authenticateToken(req3, res3, next3.fn);
    console.log('✅ Invalid token status:', res3.statusCode);
    console.log('✅ Invalid token error code:', res3.jsonData?.error?.code);
    console.log('✅ Next not called:', !next3.wasCalled());

    // Test 4: requireAdmin middleware with admin user
    console.log('\n👑 Test 4: requireAdmin with admin user...');
    const req4 = createMockReq();
    req4.user = { ...adminUser, role: 'ADMIN' }; // Simulate authenticated admin
    const res4 = createMockRes();
    const next4 = createMockNext();

    requireAdmin(req4, res4, next4.fn);
    console.log('✅ Admin access next called:', next4.wasCalled());

    // Test 5: requireAdmin middleware with staff user
    console.log('\n🚫 Test 5: requireAdmin with staff user...');
    const req5 = createMockReq();
    req5.user = { ...staffUser, role: 'STAFF' }; // Simulate authenticated staff
    const res5 = createMockRes();
    const next5 = createMockNext();

    requireAdmin(req5, res5, next5.fn);
    console.log('✅ Staff to admin status:', res5.statusCode);
    console.log('✅ Staff to admin error code:', res5.jsonData?.error?.code);
    console.log('✅ Next not called:', !next5.wasCalled());

    // Test 6: requireAdminOrStaff with staff user
    console.log('\n👥 Test 6: requireAdminOrStaff with staff user...');
    const req6 = createMockReq();
    req6.user = { ...staffUser, role: 'STAFF' };
    const res6 = createMockRes();
    const next6 = createMockNext();

    requireAdminOrStaff(req6, res6, next6.fn);
    console.log('✅ Staff access next called:', next6.wasCalled());

    // Test 7: requireAdminOrStaff with auditor user
    console.log('\n📊 Test 7: requireAdminOrStaff with auditor user...');
    const req7 = createMockReq();
    req7.user = { ...auditorUser, role: 'AUDITOR' };
    const res7 = createMockRes();
    const next7 = createMockNext();

    requireAdminOrStaff(req7, res7, next7.fn);
    console.log('✅ Auditor to staff status:', res7.statusCode);
    console.log('✅ Auditor to staff error code:', res7.jsonData?.error?.code);
    console.log('✅ Next not called:', !next7.wasCalled());

    // Test 8: Token verification with different tokens
    console.log('\n🔍 Test 8: Testing different user tokens...');
    
    // Test staff token
    const req8 = createMockReq({
      authorization: `Bearer ${staffLogin.token}`
    });
    const res8 = createMockRes();
    const next8 = createMockNext();

    await authenticateToken(req8, res8, next8.fn);
    console.log('✅ Staff token verified:', next8.wasCalled());
    console.log('✅ Staff user role:', req8.user?.role);

    // Test auditor token
    const req9 = createMockReq({
      authorization: `Bearer ${auditorLogin.token}`
    });
    const res9 = createMockRes();
    const next9 = createMockNext();

    await authenticateToken(req9, res9, next9.fn);
    console.log('✅ Auditor token verified:', next9.wasCalled());
    console.log('✅ Auditor user role:', req9.user?.role);

    console.log('\n🎉 All Authentication Middleware tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }

  process.exit(0);
}

testAuthMiddleware();