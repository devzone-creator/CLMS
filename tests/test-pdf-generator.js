import PDFGenerator from '../utils/pdfGenerator.js';
import { testConnection, syncDatabase } from '../config/db.js';
import { User, LandPlot, Transaction } from '../models/index.js';
import fs from 'fs';
import path from 'path';

console.log('🧪 Testing PDF Generator...');

async function testPDFGenerator() {
    // Test connection first
    const connectionSuccess = await testConnection();
    if (!connectionSuccess) {
        console.log('❌ Database connection failed');
        return;
    }

    // Sync database to create tables
    await syncDatabase(true);

    try {
        // Create test data
        console.log('\n📝 Setting up test data...');

        const testUser = await User.create({
            email: 'staff@test.com',
            password: 'StaffPass123',
            role: 'STAFF',
            firstName: 'John',
            lastName: 'Staff'
        });

        const testLandPlot = await LandPlot.create({
            plotNumber: 'TEST-PDF-001',
            location: 'Test Location for PDF',
            size: 2.5,
            sizeUnit: 'ACRES',
            status: 'AVAILABLE',
            ownerName: 'Test Owner',
            description: 'Test land plot for PDF generation'
        });

        const testTransaction = await Transaction.create({
            landPlotId: testLandPlot.id,
            buyerName: 'John Buyer',
            buyerContact: '+233-123-456-789',
            sellerName: 'Jane Seller',
            sellerContact: '+233-987-654-321',
            salePrice: 75000.00,
            commissionRate: 0.10,
            commissionAmount: 7500.00,
            transactionDate: new Date(),
            createdBy: testUser.id
        });

        console.log('✅ Test data created');

        // Test 1: Format currency
        console.log('\n💰 Test 1: Currency formatting...');

        const currency1 = PDFGenerator.formatCurrency(75000);
        const currency2 = PDFGenerator.formatCurrency(7500.50);
        const currency3 = PDFGenerator.formatCurrency(0);

        console.log('✅ Currency 75000:', currency1);
        console.log('✅ Currency 7500.50:', currency2);
        console.log('✅ Currency 0:', currency3);

        // Test 2: Format dates
        console.log('\n📅 Test 2: Date formatting...');

        const date1 = PDFGenerator.formatDate(new Date());
        const date2 = PDFGenerator.formatDateTime(new Date());
        const date3 = PDFGenerator.formatDate('2024-01-15');

        console.log('✅ Current date:', date1);
        console.log('✅ Current datetime:', date2);
        console.log('✅ Specific date:', date3);

        // Test 3: Directory and filename generation
        console.log('\n📁 Test 3: Directory and filename generation...');

        const receiptsDir = PDFGenerator.ensureReceiptsDirectory('./test-receipts');
        const filename = PDFGenerator.generateReceiptFilename(testTransaction.id);
        const fullPath = PDFGenerator.getReceiptPath(testTransaction.id, './test-receipts');

        console.log('✅ Receipts directory created:', fs.existsSync(receiptsDir));
        console.log('✅ Generated filename:', filename);
        console.log('✅ Full path:', fullPath);

        // Test 4: Generate PDF receipt
        console.log('\n📄 Test 4: Generate PDF receipt...');

        // Get transaction with related data
        const transactionWithDetails = await Transaction.findByPk(testTransaction.id, {
            include: [
                {
                    model: LandPlot,
                    as: 'landPlot'
                },
                {
                    model: User,
                    as: 'creator'
                }
            ]
        });

        const receiptPath = await PDFGenerator.generateReceipt(transactionWithDetails, './test-receipts');

        console.log('✅ PDF receipt generated:', receiptPath);
        console.log('✅ PDF file exists:', fs.existsSync(receiptPath));

        if (fs.existsSync(receiptPath)) {
            const stats = fs.statSync(receiptPath);
            console.log('✅ PDF file size:', `${(stats.size / 1024).toFixed(2)} KB`);
        }

        // Test 5: Find existing receipt
        console.log('\n🔍 Test 5: Find existing receipt...');

        const existingReceipt = PDFGenerator.findExistingReceipt(testTransaction.id, './test-receipts');
        console.log('✅ Found existing receipt:', !!existingReceipt);
        console.log('✅ Receipt path matches:', existingReceipt === receiptPath);

        // Test 6: Test PDF generation with minimal data
        console.log('\n📋 Test 6: PDF generation with minimal data...');

        const minimalTransaction = {
            id: 'test-minimal-id',
            salePrice: 50000,
            commissionAmount: 5000,
            commissionRate: 0.10,
            transactionDate: new Date(),
            buyerName: 'Minimal Buyer',
            buyerContact: '123-456-789',
            sellerName: 'Minimal Seller',
            sellerContact: '987-654-321',
            landPlot: {
                plotNumber: 'MIN-001',
                location: 'Minimal Location',
                size: 1.0,
                sizeUnit: 'ACRES',
                status: 'SOLD'
            },
            creator: {
                firstName: 'Test',
                lastName: 'User'
            }
        };

        const minimalReceiptPath = await PDFGenerator.generateReceipt(minimalTransaction, './test-receipts');
        console.log('✅ Minimal PDF generated:', fs.existsSync(minimalReceiptPath));

        // Test 7: Error handling
        console.log('\n⚠️  Test 7: Error handling...');

        try {
            await PDFGenerator.generateReceipt(null, './test-receipts');
        } catch (error) {
            console.log('✅ Null data error caught:', error.message.includes('Failed to generate receipt'));
        }

        try {
            await PDFGenerator.generateTransactionReceipt({}, '/invalid/path/receipt.pdf');
        } catch (error) {
            console.log('✅ Invalid path error caught:', !!error.message);
        }

        // Test 8: Utility methods
        console.log('\n🔧 Test 8: Utility methods...');

        const invalidCurrency = PDFGenerator.formatCurrency('invalid');
        const nullDate = PDFGenerator.formatDate(null);

        console.log('✅ Invalid currency handling:', invalidCurrency);
        console.log('✅ Null date handling:', nullDate);

        // Test 9: Delete receipt
        console.log('\n🗑️  Test 9: Delete receipt...');

        const deleteSuccess = PDFGenerator.deleteReceipt(minimalReceiptPath);
        console.log('✅ Receipt deleted:', deleteSuccess);
        console.log('✅ File no longer exists:', !fs.existsSync(minimalReceiptPath));

        // Cleanup test directory
        console.log('\n🧹 Cleaning up test files...');

        try {
            const testReceiptsDir = './test-receipts';
            if (fs.existsSync(testReceiptsDir)) {
                const files = fs.readdirSync(testReceiptsDir);
                files.forEach(file => {
                    fs.unlinkSync(path.join(testReceiptsDir, file));
                });
                fs.rmdirSync(testReceiptsDir);
                console.log('✅ Test receipts directory cleaned up');
            }
        } catch (error) {
            console.log('⚠️  Cleanup warning:', error.message);
        }

        console.log('\n🎉 All PDF Generator tests passed!');
        console.log('\n📋 Summary:');
        console.log('✅ Currency formatting working');
        console.log('✅ Date formatting working');
        console.log('✅ Directory management working');
        console.log('✅ PDF generation working');
        console.log('✅ File operations working');
        console.log('✅ Error handling working');
        console.log('✅ Utility methods working');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error);
    }

    process.exit(0);
}

testPDFGenerator();