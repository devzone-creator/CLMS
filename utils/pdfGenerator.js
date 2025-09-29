import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

class PDFGenerator {
  
  /**
   * Generate a transaction receipt PDF
   * @param {Object} transactionData - Transaction data with related models
   * @param {string} outputPath - Path where PDF should be saved
   * @returns {Promise<string>} Path to generated PDF file
   */
  static async generateTransactionReceipt(transactionData, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        // Create a new PDF document
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: `Transaction Receipt - ${transactionData.id}`,
            Author: 'Gbewaa Palace Land Management System',
            Subject: 'Land Transaction Receipt',
            Creator: 'CLMS PDF Generator'
          }
        });

        // Pipe the PDF to a file
        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        // Add content to PDF
        this.addReceiptHeader(doc);
        this.addTransactionDetails(doc, transactionData);
        this.addLandPlotDetails(doc, transactionData.landPlot);
        this.addPartyDetails(doc, transactionData);
        this.addFinancialDetails(doc, transactionData);
        this.addFooter(doc);

        // Finalize the PDF
        doc.end();

        // Handle stream events
        stream.on('finish', () => {
          resolve(outputPath);
        });

        stream.on('error', (error) => {
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Add header with Gbewaa Palace branding
   * @param {PDFDocument} doc - PDF document instance
   */
  static addReceiptHeader(doc) {
    // Title and branding
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('GBEWAA PALACE', 50, 50, { align: 'center' });

    doc.fontSize(16)
       .font('Helvetica')
       .fillColor('#34495e')
       .text('LAND MANAGEMENT SYSTEM', 50, 80, { align: 'center' });

    doc.fontSize(14)
       .fillColor('#7f8c8d')
       .text('Official Transaction Receipt', 50, 105, { align: 'center' });

    // Add a line separator
    doc.moveTo(50, 130)
       .lineTo(545, 130)
       .strokeColor('#bdc3c7')
       .lineWidth(2)
       .stroke();

    // Receipt title
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('LAND TRANSACTION RECEIPT', 50, 150, { align: 'center' });

    return doc;
  }

  /**
   * Add transaction details section
   * @param {PDFDocument} doc - PDF document instance
   * @param {Object} transactionData - Transaction data
   */
  static addTransactionDetails(doc, transactionData) {
    const startY = 190;
    
    // Section header
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('TRANSACTION DETAILS', 50, startY);

    // Add underline
    doc.moveTo(50, startY + 18)
       .lineTo(200, startY + 18)
       .strokeColor('#3498db')
       .lineWidth(1)
       .stroke();

    // Transaction details
    const details = [
      { label: 'Transaction ID:', value: transactionData.id },
      { label: 'Transaction Date:', value: this.formatDate(transactionData.transactionDate) },
      { label: 'Created By:', value: transactionData.creator ? `${transactionData.creator.firstName} ${transactionData.creator.lastName}` : 'System' },
      { label: 'Receipt Generated:', value: this.formatDate(new Date()) }
    ];

    let currentY = startY + 35;
    details.forEach(detail => {
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#34495e')
         .text(detail.label, 50, currentY, { width: 120 });

      doc.font('Helvetica')
         .fillColor('#2c3e50')
         .text(detail.value, 170, currentY, { width: 200 });

      currentY += 20;
    });

    return currentY + 10;
  }

  /**
   * Add land plot details section
   * @param {PDFDocument} doc - PDF document instance
   * @param {Object} landPlot - Land plot data
   */
  static addLandPlotDetails(doc, landPlot) {
    const startY = 310;
    
    // Section header
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('LAND PLOT DETAILS', 50, startY);

    // Add underline
    doc.moveTo(50, startY + 18)
       .lineTo(180, startY + 18)
       .strokeColor('#3498db')
       .lineWidth(1)
       .stroke();

    // Land plot details
    const details = [
      { label: 'Plot Number:', value: landPlot.plotNumber },
      { label: 'Location:', value: landPlot.location },
      { label: 'Size:', value: `${landPlot.size} ${landPlot.sizeUnit}` },
      { label: 'Status:', value: landPlot.status }
    ];

    let currentY = startY + 35;
    details.forEach(detail => {
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#34495e')
         .text(detail.label, 50, currentY, { width: 120 });

      doc.font('Helvetica')
         .fillColor('#2c3e50')
         .text(detail.value, 170, currentY, { width: 200 });

      currentY += 20;
    });

    return currentY + 10;
  }

  /**
   * Add party details (buyer and seller)
   * @param {PDFDocument} doc - PDF document instance
   * @param {Object} transactionData - Transaction data
   */
  static addPartyDetails(doc, transactionData) {
    const startY = 430;
    
    // Section header
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('PARTY DETAILS', 50, startY);

    // Add underline
    doc.moveTo(50, startY + 18)
       .lineTo(150, startY + 18)
       .strokeColor('#3498db')
       .lineWidth(1)
       .stroke();

    // Buyer details (left column)
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#27ae60')
       .text('BUYER', 50, startY + 35);

    const buyerDetails = [
      { label: 'Name:', value: transactionData.buyerName },
      { label: 'Contact:', value: transactionData.buyerContact }
    ];

    let currentY = startY + 55;
    buyerDetails.forEach(detail => {
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#34495e')
         .text(detail.label, 50, currentY, { width: 80 });

      doc.font('Helvetica')
         .fillColor('#2c3e50')
         .text(detail.value, 130, currentY, { width: 150 });

      currentY += 18;
    });

    // Seller details (right column)
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#e74c3c')
       .text('SELLER', 320, startY + 35);

    const sellerDetails = [
      { label: 'Name:', value: transactionData.sellerName },
      { label: 'Contact:', value: transactionData.sellerContact }
    ];

    currentY = startY + 55;
    sellerDetails.forEach(detail => {
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#34495e')
         .text(detail.label, 320, currentY, { width: 80 });

      doc.font('Helvetica')
         .fillColor('#2c3e50')
         .text(detail.value, 400, currentY, { width: 150 });

      currentY += 18;
    });

    return Math.max(currentY, startY + 95) + 10;
  }  
/**
   * Add financial details section
   * @param {PDFDocument} doc - PDF document instance
   * @param {Object} transactionData - Transaction data
   */
  static addFinancialDetails(doc, transactionData) {
    const startY = 550;
    
    // Section header
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('FINANCIAL DETAILS', 50, startY);

    // Add underline
    doc.moveTo(50, startY + 18)
       .lineTo(180, startY + 18)
       .strokeColor('#3498db')
       .lineWidth(1)
       .stroke();

    // Create a box for financial details
    doc.rect(50, startY + 30, 495, 120)
       .strokeColor('#bdc3c7')
       .lineWidth(1)
       .stroke();

    // Financial details
    const salePrice = parseFloat(transactionData.salePrice);
    const commissionAmount = parseFloat(transactionData.commissionAmount);
    const netAmount = salePrice - commissionAmount;
    const commissionRate = parseFloat(transactionData.commissionRate);

    const financialDetails = [
      { label: 'Sale Price:', value: this.formatCurrency(salePrice), highlight: false },
      { label: 'Commission Rate:', value: `${(commissionRate * 100).toFixed(2)}%`, highlight: false },
      { label: 'Commission Amount:', value: this.formatCurrency(commissionAmount), highlight: false },
      { label: 'Net Amount:', value: this.formatCurrency(netAmount), highlight: true }
    ];

    let currentY = startY + 50;
    financialDetails.forEach((detail, index) => {
      // Label
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor('#34495e')
         .text(detail.label, 70, currentY, { width: 150 });

      // Value
      doc.fontSize(11)
         .font(detail.highlight ? 'Helvetica-Bold' : 'Helvetica')
         .fillColor(detail.highlight ? '#27ae60' : '#2c3e50')
         .text(detail.value, 350, currentY, { width: 150, align: 'right' });

      currentY += 22;

      // Add separator line (except for last item)
      if (index < financialDetails.length - 1) {
        doc.moveTo(70, currentY - 5)
           .lineTo(525, currentY - 5)
           .strokeColor('#ecf0f1')
           .lineWidth(0.5)
           .stroke();
      }
    });

    return currentY + 20;
  }

  /**
   * Add footer with terms and signature section
   * @param {PDFDocument} doc - PDF document instance
   */
  static addFooter(doc) {
    const startY = 680;
    
    // Terms and conditions
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('TERMS & CONDITIONS:', 50, startY);

    const terms = [
      '• This receipt serves as official proof of land transaction.',
      '• All payments and commissions are as agreed between parties.',
      '• Any disputes should be reported to Gbewaa Palace administration.',
      '• This document is computer generated and does not require signature.'
    ];

    let currentY = startY + 20;
    terms.forEach(term => {
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#7f8c8d')
         .text(term, 50, currentY, { width: 495 });
      currentY += 15;
    });

    // Signature section
    currentY += 20;
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('AUTHORIZED BY:', 50, currentY);

    // Signature lines
    doc.moveTo(50, currentY + 40)
       .lineTo(200, currentY + 40)
       .strokeColor('#bdc3c7')
       .lineWidth(1)
       .stroke();

    doc.moveTo(350, currentY + 40)
       .lineTo(500, currentY + 40)
       .strokeColor('#bdc3c7')
       .lineWidth(1)
       .stroke();

    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#7f8c8d')
       .text('Staff Signature', 50, currentY + 50, { width: 150, align: 'center' })
       .text('Date', 350, currentY + 50, { width: 150, align: 'center' });

    // Footer
    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#95a5a6')
       .text('Generated by Gbewaa Palace Land Management System', 50, 750, { 
         width: 495, 
         align: 'center' 
       });

    doc.text(`Generated on: ${this.formatDateTime(new Date())}`, 50, 765, { 
      width: 495, 
      align: 'center' 
    });
  }

  /**
   * Format date to readable string
   * @param {Date|string} date - Date to format
   * @returns {string} Formatted date string
   */
  static formatDate(date) {
    if (!date) return 'N/A';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Format date and time to readable string
   * @param {Date|string} date - Date to format
   * @returns {string} Formatted date and time string
   */
  static formatDateTime(date) {
    if (!date) return 'N/A';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * Format currency amount
   * @param {number} amount - Amount to format
   * @returns {string} Formatted currency string
   */
  static formatCurrency(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) return 'GHS 0.00';
    
    return `GHS ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  /**
   * Ensure receipts directory exists
   * @param {string} baseDir - Base directory for receipts
   * @returns {string} Full path to receipts directory
   */
  static ensureReceiptsDirectory(baseDir = './receipts') {
    const receiptsDir = path.resolve(baseDir);
    
    if (!fs.existsSync(receiptsDir)) {
      fs.mkdirSync(receiptsDir, { recursive: true });
    }
    
    return receiptsDir;
  }

  /**
   * Generate unique filename for receipt
   * @param {string} transactionId - Transaction ID
   * @returns {string} Unique filename
   */
  static generateReceiptFilename(transactionId) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `receipt-${transactionId}-${timestamp}.pdf`;
  }

  /**
   * Get full path for receipt file
   * @param {string} transactionId - Transaction ID
   * @param {string} baseDir - Base directory for receipts
   * @returns {string} Full path to receipt file
   */
  static getReceiptPath(transactionId, baseDir = './receipts') {
    const receiptsDir = this.ensureReceiptsDirectory(baseDir);
    const filename = this.generateReceiptFilename(transactionId);
    return path.join(receiptsDir, filename);
  }

  /**
   * Generate receipt for transaction (convenience method)
   * @param {Object} transactionData - Transaction data with related models
   * @param {string} baseDir - Base directory for receipts (optional)
   * @returns {Promise<string>} Path to generated PDF file
   */
  static async generateReceipt(transactionData, baseDir = './receipts') {
    try {
      const outputPath = this.getReceiptPath(transactionData.id, baseDir);
      return await this.generateTransactionReceipt(transactionData, outputPath);
    } catch (error) {
      throw new Error(`Failed to generate receipt: ${error.message}`);
    }
  }

  /**
   * Check if receipt exists for transaction
   * @param {string} transactionId - Transaction ID
   * @param {string} baseDir - Base directory for receipts
   * @returns {string|null} Path to existing receipt or null
   */
  static findExistingReceipt(transactionId, baseDir = './receipts') {
    try {
      const receiptsDir = path.resolve(baseDir);
      
      if (!fs.existsSync(receiptsDir)) {
        return null;
      }

      const files = fs.readdirSync(receiptsDir);
      const receiptFile = files.find(file => 
        file.startsWith(`receipt-${transactionId}-`) && file.endsWith('.pdf')
      );

      return receiptFile ? path.join(receiptsDir, receiptFile) : null;
    } catch (error) {
      console.error('Error finding existing receipt:', error);
      return null;
    }
  }

  /**
   * Delete receipt file
   * @param {string} filePath - Path to receipt file
   * @returns {boolean} Success status
   */
  static deleteReceipt(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting receipt:', error);
      return false;
    }
  }
}

export default PDFGenerator;