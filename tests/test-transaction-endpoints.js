import request from 'supertest';
import { sequelize } from '../config/db.js';
import { User, LandPlot, Transaction } from '../models/index.js';
import jwt from 'jsonwebtoken';

// Mock Express app for testing
import express from 'express';
import cors from 'cors';
import transactionRoutes from '../routes/transactions.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/transactions', transactionRoutes);

describe('Transaction Endpoints', () => {
  let adminToken, staffToken, auditorToken;
  let adminUser, staffUser, auditorUser;
  let testLandPlot;

  beforeAll(async () => {
    // Sync database
    await sequelize.sync({ force: true });

    // Create test users
    adminUser = await User.create({
      email: 'admin@test.com',
      password: 'password123',
      role: 'ADMIN',
      firstName: 'Admin',
      lastName: 'User'
    });

    staffUser = await User.create({
      email: 'staff@test.com',
      password: 'password123',
      role: 'STAFF',
      firstName: 'Staff',
      lastName: 'User'
    });

    auditorUser = await User.create({
      email: 'auditor@test.com',
      password: 'password123',
      role: 'AUDITOR',
      firstName: 'Auditor',
      lastName: 'User'
    });

    // Generate JWT tokens
    adminToken = jwt.sign(
      { userId: adminUser.id, email: adminUser.email, role: adminUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    staffToken = jwt.sign(
      { userId: staffUser.id, email: staffUser.email, role: staffUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    auditorToken = jwt.sign(
      { userId: auditorUser.id, email: auditorUser.email, role: auditorUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Create test land plot
    testLandPlot = await LandPlot.create({
      plotNumber: 'TEST-001',
      location: 'Test Location',
      size: 1.5,
      sizeUnit: 'ACRES',
      status: 'AVAILABLE',
      ownerName: 'Test Owner',
      description: 'Test land plot for transactions'
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up transactions before each test
    await Transaction.destroy({ where: {} });
    
    // Reset land plot status
    await testLandPlot.update({ status: 'AVAILABLE' });
  });

  describe('POST /transactions', () => {
    const validTransactionData = {
      landPlotId: null, // Will be set in tests
      buyerName: 'John Buyer',
      buyerContact: '1234567890',
      sellerName: 'Jane Seller',
      sellerContact: '0987654321',
      salePrice: 50000,
      commissionRate: 0.10
    };

    test('should record transaction successfully with staff token', async () => {
      const transactionData = {
        ...validTransactionData,
        landPlotId: testLandPlot.id
      };

      const response = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(transactionData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.buyerName).toBe('John Buyer');
      expect(response.body.data.salePrice).toBe(50000);
      expect(response.body.data.commissionAmount).toBe(5000);
      expect(response.body.data.landPlot.status).toBe('SOLD');
    });

    test('should record transaction successfully with admin token', async () => {
      const transactionData = {
        ...validTransactionData,
        landPlotId: testLandPlot.id
      };

      const response = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(transactionData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    test('should fail without authentication', async () => {
      const transactionData = {
        ...validTransactionData,
        landPlotId: testLandPlot.id
      };

      const response = await request(app)
        .post('/transactions')
        .send(transactionData);

      expect(response.status).toBe(401);
    });

    test('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          landPlotId: testLandPlot.id,
          buyerName: 'John Buyer'
          // Missing other required fields
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should fail with invalid land plot ID', async () => {
      const transactionData = {
        ...validTransactionData,
        landPlotId: '00000000-0000-0000-0000-000000000000'
      };

      const response = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(transactionData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('not found');
    });

    test('should fail when land plot is already sold', async () => {
      // First, mark the land plot as sold
      await testLandPlot.update({ status: 'SOLD' });

      const transactionData = {
        ...validTransactionData,
        landPlotId: testLandPlot.id
      };

      const response = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(transactionData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('already sold');
    });

    test('should fail with negative sale price', async () => {
      const transactionData = {
        ...validTransactionData,
        landPlotId: testLandPlot.id,
        salePrice: -1000
      };

      const response = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(transactionData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });  describe(
'GET /transactions', () => {
    beforeEach(async () => {
      // Create test transactions
      await Transaction.create({
        landPlotId: testLandPlot.id,
        buyerName: 'John Buyer',
        buyerContact: '1234567890',
        sellerName: 'Jane Seller',
        sellerContact: '0987654321',
        salePrice: 50000,
        commissionRate: 0.10,
        commissionAmount: 5000,
        createdBy: staffUser.id
      });

      await Transaction.create({
        landPlotId: testLandPlot.id,
        buyerName: 'Bob Buyer',
        buyerContact: '1111111111',
        sellerName: 'Alice Seller',
        sellerContact: '2222222222',
        salePrice: 75000,
        commissionRate: 0.10,
        commissionAmount: 7500,
        createdBy: adminUser.id
      });
    });

    test('should get all transactions with staff token', async () => {
      const response = await request(app)
        .get('/transactions')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.totalItems).toBe(2);
    });

    test('should get all transactions with admin token', async () => {
      const response = await request(app)
        .get('/transactions')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should get all transactions with auditor token', async () => {
      const response = await request(app)
        .get('/transactions')
        .set('Authorization', `Bearer ${auditorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/transactions');

      expect(response.status).toBe(401);
    });

    test('should filter transactions by buyer name', async () => {
      const response = await request(app)
        .get('/transactions?buyerName=John')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].buyerName).toBe('John Buyer');
    });

    test('should filter transactions by price range', async () => {
      const response = await request(app)
        .get('/transactions?minPrice=60000&maxPrice=80000')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].salePrice).toBe(75000);
    });

    test('should paginate results', async () => {
      const response = await request(app)
        .get('/transactions?page=1&limit=1')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.totalPages).toBe(2);
    });
  });

  describe('GET /transactions/:id', () => {
    let testTransaction;

    beforeEach(async () => {
      testTransaction = await Transaction.create({
        landPlotId: testLandPlot.id,
        buyerName: 'John Buyer',
        buyerContact: '1234567890',
        sellerName: 'Jane Seller',
        sellerContact: '0987654321',
        salePrice: 50000,
        commissionRate: 0.10,
        commissionAmount: 5000,
        createdBy: staffUser.id
      });
    });

    test('should get transaction by ID with staff token', async () => {
      const response = await request(app)
        .get(`/transactions/${testTransaction.id}`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testTransaction.id);
      expect(response.body.data.buyerName).toBe('John Buyer');
      expect(response.body.data.landPlot).toBeDefined();
      expect(response.body.data.creator).toBeDefined();
    });

    test('should get transaction by ID with admin token', async () => {
      const response = await request(app)
        .get(`/transactions/${testTransaction.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should get transaction by ID with auditor token', async () => {
      const response = await request(app)
        .get(`/transactions/${testTransaction.id}`)
        .set('Authorization', `Bearer ${auditorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/transactions/${testTransaction.id}`);

      expect(response.status).toBe(401);
    });

    test('should return 404 for non-existent transaction', async () => {
      const response = await request(app)
        .get('/transactions/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /transactions/stats', () => {
    beforeEach(async () => {
      // Create test transactions
      await Transaction.create({
        landPlotId: testLandPlot.id,
        buyerName: 'John Buyer',
        buyerContact: '1234567890',
        sellerName: 'Jane Seller',
        sellerContact: '0987654321',
        salePrice: 50000,
        commissionRate: 0.10,
        commissionAmount: 5000,
        createdBy: staffUser.id
      });

      await Transaction.create({
        landPlotId: testLandPlot.id,
        buyerName: 'Bob Buyer',
        buyerContact: '1111111111',
        sellerName: 'Alice Seller',
        sellerContact: '2222222222',
        salePrice: 75000,
        commissionRate: 0.10,
        commissionAmount: 7500,
        createdBy: adminUser.id
      });
    });

    test('should get transaction statistics with staff token', async () => {
      const response = await request(app)
        .get('/transactions/stats')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalTransactions).toBe(2);
      expect(response.body.data.totalRevenue).toBe(125000);
      expect(response.body.data.totalCommission).toBe(12500);
      expect(response.body.data.averagePrice).toBe(62500);
    });

    test('should get transaction statistics with admin token', async () => {
      const response = await request(app)
        .get('/transactions/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should get transaction statistics with auditor token', async () => {
      const response = await request(app)
        .get('/transactions/stats')
        .set('Authorization', `Bearer ${auditorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/transactions/stats');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /transactions/calculate-commission', () => {
    test('should calculate commission with default rate', async () => {
      const response = await request(app)
        .post('/transactions/calculate-commission')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ salePrice: 100000 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.salePrice).toBe(100000);
      expect(response.body.data.commissionAmount).toBe(10000);
      expect(response.body.data.netAmount).toBe(90000);
    });

    test('should calculate commission with custom rate', async () => {
      const response = await request(app)
        .post('/transactions/calculate-commission')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ 
          salePrice: 100000,
          commissionRate: 0.15
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.commissionAmount).toBe(15000);
      expect(response.body.data.netAmount).toBe(85000);
    });

    test('should fail with invalid sale price', async () => {
      const response = await request(app)
        .post('/transactions/calculate-commission')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ salePrice: -1000 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .post('/transactions/calculate-commission')
        .send({ salePrice: 100000 });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /transactions/recent', () => {
    beforeEach(async () => {
      // Create test transactions with different timestamps
      await Transaction.create({
        landPlotId: testLandPlot.id,
        buyerName: 'John Buyer',
        buyerContact: '1234567890',
        sellerName: 'Jane Seller',
        sellerContact: '0987654321',
        salePrice: 50000,
        commissionRate: 0.10,
        commissionAmount: 5000,
        createdBy: staffUser.id,
        createdAt: new Date('2024-01-01')
      });

      await Transaction.create({
        landPlotId: testLandPlot.id,
        buyerName: 'Bob Buyer',
        buyerContact: '1111111111',
        sellerName: 'Alice Seller',
        sellerContact: '2222222222',
        salePrice: 75000,
        commissionRate: 0.10,
        commissionAmount: 7500,
        createdBy: adminUser.id,
        createdAt: new Date('2024-01-02')
      });
    });

    test('should get recent transactions', async () => {
      const response = await request(app)
        .get('/transactions/recent')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      // Should be ordered by most recent first
      expect(response.body.data[0].buyerName).toBe('Bob Buyer');
    });

    test('should limit recent transactions', async () => {
      const response = await request(app)
        .get('/transactions/recent?limit=1')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/transactions/recent');

      expect(response.status).toBe(401);
    });
  });
});