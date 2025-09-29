import request from 'supertest';
import { sequelize } from '../config/db.js';
import { User, LandPlot, Transaction } from '../models/index.js';
import TransactionService from '../services/transactionService.js';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

// Mock Express app for testing
import express from 'express';
import cors from 'cors';
import transactionRoutes from '../routes/transactions.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/transactions', transactionRoutes);

describe('PDF Integration Tests', () => {
  let adminToken, staffToken;
  let adminUser, staffUser;
  let testLandPlot, testTransaction;

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

    // Create test land plot
    testLandPlot = await LandPlot.create({
      plotNumber: 'PDF-TEST-001',
      location: 'PDF Test Location',
      size: 1.5,
      sizeUnit: 'ACRES',
      status: 'AVAILABLE',
      ownerName: 'PDF Test Owner',
      description: 'Test land plot for PDF integration'
    });
  });

  afterAll(async () => {
    // Clean up test receipts
    try {
      const receiptsDir = './receipts';
      if (fs.existsSync(receiptsDir)) {
        const files = fs.readdirSync(receiptsDir);
        files.forEach(file => {
          if (file.includes('PDF-TEST') || file.includes('test-')) {
            fs.unlinkSync(path.join(receiptsDir, file));
          }
        });
      }
    } catch (error) {
      console.log('Cleanup warning:', error.message);
    }

    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up transactions before each test
    await Transaction.destroy({ where: {} });
    
    // Reset land plot status
    await testLandPlot.update({ status: 'AVAILABLE' });
  });

  describe('Automatic PDF Generation', () => {
    test('should automatically generate PDF when recording transaction', async () => {
      const transactionData = {
        landPlotId: testLandPlot.id,
        buyerName: 'John PDF Buyer',
        buyerContact: '1234567890',
        sellerName: 'Jane PDF Seller',
        sellerContact: '0987654321',
        salePrice: 50000,
        commissionRate: 0.10
      };

      const transaction = await TransactionService.recordTransaction(transactionData, staffUser.id);

      expect(transaction).toBeDefined();
      expect(transaction.receiptPath).toBeDefined();
      expect(fs.existsSync(transaction.receiptPath)).toBe(true);

      // Check PDF file size (should be reasonable)
      const stats = fs.statSync(transaction.receiptPath);
      expect(stats.size).toBeGreaterThan(1000); // At least 1KB
      expect(stats.size).toBeLessThan(1000000); // Less than 1MB
    });

    test('should handle PDF generation failure gracefully', async () => {
      // Mock PDF generation to fail
      const originalGenerateReceipt = (await import('../utils/pdfGenerator.js')).default.generateReceipt;
      const PDFGenerator = (await import('../utils/pdfGenerator.js')).default;
      
      PDFGenerator.generateReceipt = jest.fn().mockRejectedValue(new Error('PDF generation failed'));

      const transactionData = {
        landPlotId: testLandPlot.id,
        buyerName: 'John Buyer',
        buyerContact: '1234567890',
        sellerName: 'Jane Seller',
        sellerContact: '0987654321',
        salePrice: 50000
      };

      // Transaction should still succeed even if PDF fails
      const transaction = await TransactionService.recordTransaction(transactionData, staffUser.id);
      
      expect(transaction).toBeDefined();
      expect(transaction.salePrice).toBe(50000);

      // Restore original method
      PDFGenerator.generateReceipt = originalGenerateReceipt;
    });
  });

  describe('PDF Receipt Download', () => {
    beforeEach(async () => {
      // Create a transaction with PDF
      const transactionData = {
        landPlotId: testLandPlot.id,
        buyerName: 'Download Test Buyer',
        buyerContact: '1234567890',
        sellerName: 'Download Test Seller',
        sellerContact: '0987654321',
        salePrice: 75000
      };

      testTransaction = await TransactionService.recordTransaction(transactionData, staffUser.id);
    });

    test('should download PDF receipt with staff token', async () => {
      const response = await request(app)
        .get(`/transactions/${testTransaction.id}/receipt`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.body.length).toBeGreaterThan(1000);
    });

    test('should download PDF receipt with admin token', async () => {
      const response = await request(app)
        .get(`/transactions/${testTransaction.id}/receipt`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/transactions/${testTransaction.id}/receipt`);

      expect(response.status).toBe(401);
    });

    test('should return 404 for non-existent transaction', async () => {
      const response = await request(app)
        .get('/transactions/00000000-0000-0000-0000-000000000000/receipt')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    test('should generate PDF if it doesn\'t exist', async () => {
      // Create transaction without PDF
      const transaction = await Transaction.create({
        landPlotId: testLandPlot.id,
        buyerName: 'No PDF Buyer',
        buyerContact: '1234567890',
        sellerName: 'No PDF Seller',
        sellerContact: '0987654321',
        salePrice: 60000,
        commissionRate: 0.10,
        commissionAmount: 6000,
        createdBy: staffUser.id
      });

      const response = await request(app)
        .get(`/transactions/${transaction.id}/receipt`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
    });
  });

  describe('PDF Receipt Regeneration', () => {
    beforeEach(async () => {
      // Create a transaction with PDF
      const transactionData = {
        landPlotId: testLandPlot.id,
        buyerName: 'Regen Test Buyer',
        buyerContact: '1234567890',
        sellerName: 'Regen Test Seller',
        sellerContact: '0987654321',
        salePrice: 80000
      };

      testTransaction = await TransactionService.recordTransaction(transactionData, staffUser.id);
    });

    test('should regenerate PDF receipt with staff token', async () => {
      const originalPath = testTransaction.receiptPath;
      
      const response = await request(app)
        .post(`/transactions/${testTransaction.id}/regenerate-receipt`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.receiptPath).toBeDefined();
      expect(fs.existsSync(response.body.data.receiptPath)).toBe(true);
      
      // New path should be different (due to timestamp)
      expect(response.body.data.receiptPath).not.toBe(originalPath);
    });

    test('should regenerate PDF receipt with admin token', async () => {
      const response = await request(app)
        .post(`/transactions/${testTransaction.id}/regenerate-receipt`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .post(`/transactions/${testTransaction.id}/regenerate-receipt`);

      expect(response.status).toBe(401);
    });

    test('should return 404 for non-existent transaction', async () => {
      const response = await request(app)
        .post('/transactions/00000000-0000-0000-0000-000000000000/regenerate-receipt')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PDF Service Methods', () => {
    beforeEach(async () => {
      // Create a transaction with PDF
      const transactionData = {
        landPlotId: testLandPlot.id,
        buyerName: 'Service Test Buyer',
        buyerContact: '1234567890',
        sellerName: 'Service Test Seller',
        sellerContact: '0987654321',
        salePrice: 90000
      };

      testTransaction = await TransactionService.recordTransaction(transactionData, staffUser.id);
    });

    test('should get receipt path for existing transaction', async () => {
      const receiptPath = await TransactionService.getReceiptPath(testTransaction.id);
      
      expect(receiptPath).toBeDefined();
      expect(fs.existsSync(receiptPath)).toBe(true);
    });

    test('should generate receipt for transaction without one', async () => {
      // Create transaction without PDF
      const transaction = await Transaction.create({
        landPlotId: testLandPlot.id,
        buyerName: 'Manual PDF Buyer',
        buyerContact: '1234567890',
        sellerName: 'Manual PDF Seller',
        sellerContact: '0987654321',
        salePrice: 55000,
        commissionRate: 0.10,
        commissionAmount: 5500,
        createdBy: staffUser.id
      });

      const receiptPath = await TransactionService.generateReceiptForTransaction(transaction.id);
      
      expect(receiptPath).toBeDefined();
      expect(fs.existsSync(receiptPath)).toBe(true);
      
      // Check that transaction was updated with receipt path
      const updatedTransaction = await Transaction.findByPk(transaction.id);
      expect(updatedTransaction.receiptPath).toBe(receiptPath);
    });

    test('should regenerate receipt and delete old one', async () => {
      const originalPath = testTransaction.receiptPath;
      
      const newReceiptPath = await TransactionService.regenerateReceipt(testTransaction.id);
      
      expect(newReceiptPath).toBeDefined();
      expect(newReceiptPath).not.toBe(originalPath);
      expect(fs.existsSync(newReceiptPath)).toBe(true);
      expect(fs.existsSync(originalPath)).toBe(false); // Old file should be deleted
    });

    test('should handle errors gracefully', async () => {
      await expect(
        TransactionService.getReceiptPath('invalid-id')
      ).rejects.toThrow();

      await expect(
        TransactionService.generateReceiptForTransaction('invalid-id')
      ).rejects.toThrow();

      await expect(
        TransactionService.regenerateReceipt('invalid-id')
      ).rejects.toThrow();
    });
  });
});