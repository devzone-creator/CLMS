import request from 'supertest';
import { sequelize } from '../config/db.js';
import { User, LandPlot, Transaction } from '../models/index.js';
import jwt from 'jsonwebtoken';

// Mock Express app for testing
import express from 'express';
import cors from 'cors';
import reportsRoutes from '../routes/reports.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/reports', reportsRoutes);

describe('Reports Endpoints', () => {
  let adminToken, auditorToken, staffToken;
  let adminUser, auditorUser, staffUser;
  let testLandPlots, testTransactions;

  beforeAll(async () => {
    // Sync database
    await sequelize.sync({ force: true });

    // Create test users
    adminUser = await User.create({
      email: 'admin@reports.com',
      password: 'password123',
      role: 'ADMIN',
      firstName: 'Admin',
      lastName: 'User'
    });

    auditorUser = await User.create({
      email: 'auditor@reports.com',
      password: 'password123',
      role: 'AUDITOR',
      firstName: 'Auditor',
      lastName: 'User'
    });

    staffUser = await User.create({
      email: 'staff@reports.com',
      password: 'password123',
      role: 'STAFF',
      firstName: 'Staff',
      lastName: 'User'
    });

    // Generate JWT tokens
    adminToken = jwt.sign(
      { userId: adminUser.id, email: adminUser.email, role: adminUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    auditorToken = jwt.sign(
      { userId: auditorUser.id, email: auditorUser.email, role: auditorUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    staffToken = jwt.sign(
      { userId: staffUser.id, email: staffUser.email, role: staffUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Create test land plots
    const landPlot1 = await LandPlot.create({
      plotNumber: 'RPT-ENDPOINT-001',
      location: 'Test Location A',
      size: 2.5,
      sizeUnit: 'ACRES',
      status: 'SOLD',
      ownerName: 'Test Owner 1'
    });

    const landPlot2 = await LandPlot.create({
      plotNumber: 'RPT-ENDPOINT-002',
      location: 'Test Location B',
      size: 1.8,
      sizeUnit: 'ACRES',
      status: 'AVAILABLE',
      ownerName: 'Test Owner 2'
    });

    const landPlot3 = await LandPlot.create({
      plotNumber: 'RPT-ENDPOINT-003',
      location: 'Test Location A',
      size: 3.2,
      sizeUnit: 'HECTARES',
      status: 'DISPUTED',
      ownerName: 'Test Owner 3'
    });

    testLandPlots = [landPlot1, landPlot2, landPlot3];

    // Create test transactions
    const transaction1 = await Transaction.create({
      landPlotId: landPlot1.id,
      buyerName: 'Endpoint Buyer One',
      buyerContact: '1234567890',
      sellerName: 'Endpoint Seller One',
      sellerContact: '0987654321',
      salePrice: 50000,
      commissionRate: 0.10,
      commissionAmount: 5000,
      transactionDate: new Date('2024-01-15'),
      createdBy: staffUser.id
    });

    const transaction2 = await Transaction.create({
      landPlotId: landPlot1.id,
      buyerName: 'Endpoint Buyer Two',
      buyerContact: '1111111111',
      sellerName: 'Endpoint Seller Two',
      sellerContact: '2222222222',
      salePrice: 75000,
      commissionRate: 0.12,
      commissionAmount: 9000,
      transactionDate: new Date('2024-02-20'),
      createdBy: adminUser.id
    });

    testTransactions = [transaction1, transaction2];
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /reports/summary', () => {
    test('should get business summary with admin token', async () => {
      const response = await request(app)
        .get('/reports/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.landStatistics).toBeDefined();
      expect(response.body.data.recentActivity).toBeDefined();
      expect(response.body.data.summary.totalTransactions).toBe(2);
      expect(response.body.data.summary.totalRevenue).toBe(125000);
    });

    test('should get business summary with auditor token', async () => {
      const response = await request(app)
        .get('/reports/summary')
        .set('Authorization', `Bearer ${auditorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should fail with staff token', async () => {
      const response = await request(app)
        .get('/reports/summary')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/reports/summary');

      expect(response.status).toBe(401);
    });

    test('should filter by date range', async () => {
      const response = await request(app)
        .get('/reports/summary?startDate=2024-02-01&endDate=2024-02-28')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.summary.totalTransactions).toBe(1);
      expect(response.body.data.summary.totalRevenue).toBe(75000);
    });

    test('should validate date format', async () => {
      const response = await request(app)
        .get('/reports/summary?startDate=invalid-date')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_DATE_FORMAT');
    });

    test('should validate date range', async () => {
      const response = await request(app)
        .get('/reports/summary?startDate=2024-02-01&endDate=2024-01-01')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_DATE_RANGE');
    });
  });

  describe('GET /reports/transactions', () => {
    test('should get transaction report with default grouping', async () => {
      const response = await request(app)
        .get('/reports/transactions')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.groupBy).toBe('date');
      expect(response.body.data.data).toBeDefined();
      expect(response.body.data.totals).toBeDefined();
      expect(response.body.data.totals.totalTransactions).toBe(2);
    });

    test('should group by user', async () => {
      const response = await request(app)
        .get('/reports/transactions?groupBy=user')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.groupBy).toBe('user');
      expect(response.body.data.data.length).toBeGreaterThan(0);
    });

    test('should validate groupBy parameter', async () => {
      const response = await request(app)
        .get('/reports/transactions?groupBy=invalid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_GROUP_BY');
    });

    test('should validate status parameter', async () => {
      const response = await request(app)
        .get('/reports/transactions?status=INVALID_STATUS')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_STATUS');
    });
  });

  describe('GET /reports/land-plots', () => {
    test('should get land plot report', async () => {
      const response = await request(app)
        .get('/reports/land-plots')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.statusBreakdown).toBeDefined();
      expect(response.body.data.sizeUnitBreakdown).toBeDefined();
      expect(response.body.data.plots).toBeDefined();
      expect(response.body.data.summary.totalPlots).toBe(3);
    });

    test('should filter by status', async () => {
      const response = await request(app)
        .get('/reports/land-plots?status=AVAILABLE')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.summary.totalPlots).toBe(1);
    });

    test('should filter by size range', async () => {
      const response = await request(app)
        .get('/reports/land-plots?sizeMin=2&sizeMax=3')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.summary.totalPlots).toBe(1);
    });

    test('should validate size parameters', async () => {
      const response = await request(app)
        .get('/reports/land-plots?sizeMin=invalid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_SIZE_MIN');
    });

    test('should validate size range', async () => {
      const response = await request(app)
        .get('/reports/land-plots?sizeMin=5&sizeMax=2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_SIZE_RANGE');
    });
  });

  describe('GET /reports/user-performance', () => {
    test('should get user performance report', async () => {
      const response = await request(app)
        .get('/reports/user-performance')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.userPerformance).toBeDefined();
      expect(response.body.data.topPerformers).toBeDefined();
      expect(response.body.data.summary.totalUsers).toBeGreaterThan(0);
    });

    test('should filter by role', async () => {
      const response = await request(app)
        .get('/reports/user-performance?role=STAFF')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.summary.totalUsers).toBe(1);
    });

    test('should validate role parameter', async () => {
      const response = await request(app)
        .get('/reports/user-performance?role=INVALID_ROLE')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_ROLE');
    });
  });

  describe('GET /reports/disputed-plots', () => {
    test('should get disputed plots report', async () => {
      const response = await request(app)
        .get('/reports/disputed-plots')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.disputedPlots).toBeDefined();
      expect(response.body.data.locationBreakdown).toBeDefined();
      expect(response.body.data.summary.totalDisputedPlots).toBe(1);
    });

    test('should work with auditor token', async () => {
      const response = await request(app)
        .get('/reports/disputed-plots')
        .set('Authorization', `Bearer ${auditorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /reports/monthly-trends', () => {
    test('should get monthly trends report with default months', async () => {
      const response = await request(app)
        .get('/reports/monthly-trends')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.period).toBeDefined();
      expect(response.body.data.trends).toBeDefined();
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.trends.length).toBe(12);
    });

    test('should get monthly trends with custom months', async () => {
      const response = await request(app)
        .get('/reports/monthly-trends?months=6')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.trends.length).toBe(6);
    });

    test('should validate months parameter', async () => {
      const response = await request(app)
        .get('/reports/monthly-trends?months=invalid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_MONTHS');
    });

    test('should validate months range', async () => {
      const response = await request(app)
        .get('/reports/monthly-trends?months=100')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_MONTHS');
    });
  });

  describe('Authorization Tests', () => {
    test('all endpoints should require authentication', async () => {
      const endpoints = [
        '/reports/summary',
        '/reports/transactions',
        '/reports/land-plots',
        '/reports/user-performance',
        '/reports/disputed-plots',
        '/reports/monthly-trends'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app).get(endpoint);
        expect(response.status).toBe(401);
      }
    });

    test('all endpoints should deny staff access', async () => {
      const endpoints = [
        '/reports/summary',
        '/reports/transactions',
        '/reports/land-plots',
        '/reports/user-performance',
        '/reports/disputed-plots',
        '/reports/monthly-trends'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${staffToken}`);
        expect(response.status).toBe(403);
        expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
      }
    });

    test('all endpoints should allow admin access', async () => {
      const endpoints = [
        '/reports/summary',
        '/reports/transactions',
        '/reports/land-plots',
        '/reports/user-performance',
        '/reports/disputed-plots',
        '/reports/monthly-trends'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${adminToken}`);
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }
    });

    test('all endpoints should allow auditor access', async () => {
      const endpoints = [
        '/reports/summary',
        '/reports/transactions',
        '/reports/land-plots',
        '/reports/user-performance',
        '/reports/disputed-plots',
        '/reports/monthly-trends'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${auditorToken}`);
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }
    });
  });
});