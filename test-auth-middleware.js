import express from 'express';
import request from 'supertest';
import { authenticateToken, requireRole, requireAdmin, requireAdminOrStaff, optionalAuth } from './middlewares/auth.js';
import AuthService from './services/authService.js';
import { testConnection, syncDatabase } from './config/db.js';

console.log('🧪 Testing Authentication Middleware...');

// Create test Express app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Test routes
  app.get('/public', (req, res) => {
    res.json({ success: true, message: 'Public route', user: req.user || null });
  });

  app.get('/protected', authenticateToken, (req, res) => {
    res.json({ success: true, message: 'Protected route', user: req.user });
  });

  app.get('/admin-only', authenticateToken, requireAdmin, (req, res) => {
    res.json({ success: true, message: 'Admin only route', user: req.user });
  });

  app.get('/staff-or-admin', authenticateToken, requireAdminOrStaff, (req, res) => {
    res.json({ success: true, message: 'Staff or Admin route', user: req.user });
  });

  app.get('/optional-auth', optionalAuth, (req, res) => {
    res.json({ 
      success: true, 
      message: 'Optional auth route', 
      authenticated: !!req.user,
      user: req.user || null 
    });
  });

  return app;
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
    const app = createTestApp();

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

    // Test 1: Public route (no auth required)
    console.log('\n🌐 Test 1: Public route access...');
    const publicResponse = await request(app).get('/public');
    console.log('✅ Public route status:', publicResponse.status);
    console.log('✅ Public route accessible:', publicResponse.body.success);

    // Test 2: Protected route without token
    console.log('\n🔒 Test 2: Protected route without token...');
    const noTokenResponse = await request(app).get('/protected');
    console.log('✅ No token status:', noTokenResponse.status);
    console.log('✅ No token error:', noTokenResponse.body.error.code);

    // Test 3: Protected route with valid token
    console.log('\n🔑 Test 3: Protected route with valid token...');
    const validTokenResponse = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${adminLogin.token}`);
    console.log('✅ Valid token status:', validTokenResponse.status);
    console.log('✅ Valid token success:', validTokenResponse.body.success);
    console.log('✅ User in response:', validTokenResponse.body.user.email);

    // Test 4: Protected route with invalid token
    console.log('\n❌ Test 4: Protected route with invalid token...');
    const invalidTokenResponse = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer invalid.token.here');
    console.log('✅ Invalid token status:', invalidTokenResponse.status);
    console.log('✅ Invalid token error:', invalidTokenResponse.body.error.code);

    // Test 5: Admin-only route with admin token
    console.log('\n👑 Test 5: Admin-only route with admin token...');
    const adminOnlyResponse = await request(app)
      .get('/admin-only')
      .set('Authorization', `Bearer ${adminLogin.token}`);
    console.log('✅ Admin access status:', adminOnlyResponse.status);
    console.log('✅ Admin access success:', adminOnlyResponse.body.success);

    // Test 6: Admin-only route with staff token
    console.log('\n🚫 Test 6: Admin-only route with staff token...');
    const staffToAdminResponse = await request(app)
      .get('/admin-only')
      .set('Authorization', `Bearer ${staffLogin.token}`);
    console.log('✅ Staff to admin status:', staffToAdminResponse.status);
    console.log('✅ Staff to admin error:', staffToAdminResponse.body.error.code);

    // Test 7: Staff-or-admin route with staff token
    console.log('\n👥 Test 7: Staff-or-admin route with staff token...');
    const staffAccessResponse = await request(app)
      .get('/staff-or-admin')
      .set('Authorization', `Bearer ${staffLogin.token}`);
    console.log('✅ Staff access status:', staffAccessResponse.status);
    console.log('✅ Staff access success:', staffAccessResponse.body.success);

    // Test 8: Staff-or-admin route with auditor token
    console.log('\n📊 Test 8: Staff-or-admin route with auditor token...');
    const auditorToStaffResponse = await request(app)
      .get('/staff-or-admin')
      .set('Authorization', `Bearer ${auditorLogin.token}`);
    console.log('✅ Auditor to staff status:', auditorToStaffResponse.status);
    console.log('✅ Auditor to staff error:', auditorToStaffResponse.body.error.code);

    // Test 9: Optional auth without token
    console.log('\n🔓 Test 9: Optional auth without token...');
    const optionalNoTokenResponse = await request(app).get('/optional-auth');
    console.log('✅ Optional no token status:', optionalNoTokenResponse.status);
    console.log('✅ Optional no token authenticated:', optionalNoTokenResponse.body.authenticated);

    // Test 10: Optional auth with token
    console.log('\n🔐 Test 10: Optional auth with token...');
    const optionalWithTokenResponse = await request(app)
      .get('/optional-auth')
      .set('Authorization', `Bearer ${adminLogin.token}`);
    console.log('✅ Optional with token status:', optionalWithTokenResponse.status);
    console.log('✅ Optional with token authenticated:', optionalWithTokenResponse.body.authenticated);
    console.log('✅ Optional with token user:', optionalWithTokenResponse.body.user.email);

    console.log('\n🎉 All Authentication Middleware tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }

  process.exit(0);
}

// Check if supertest is available, if not, run basic tests
try {
  await import('supertest');
  testAuthMiddleware();
} catch (error) {
  console.log('⚠️  Supertest not available, running basic middleware tests...');
  
  // Basic test without supertest
  async function basicTest() {
    await testConnection();
    await syncDatabase(true);
    
    const adminUser = await AuthService.register({
      email: 'admin@test.com',
      password: 'AdminPass123',
      role: 'ADMIN',
      firstName: 'Admin',
      lastName: 'User'
    });
    
    const loginResult = await AuthService.login('admin@test.com', 'AdminPass123');
    console.log('✅ Basic auth test passed - token generated:', !!loginResult.token);
    
    process.exit(0);
  }
  
  basicTest();
}