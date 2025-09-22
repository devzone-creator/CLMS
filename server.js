import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';

// Import database connection
import { testConnection, syncDatabase } from './config/db.js';

// Import routes
import authRoutes from './routes/auth.js';
import landRoutes from './routes/lands.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

app.use(morgan('combined')); // Request logging
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'CLMS API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/lands', landRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Custom Land Management System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      lands: '/api/lands'
    },
    documentation: 'See README.md for API documentation'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);

  // Default error response
  const errorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : err.message
    }
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
  }

  res.status(err.status || 500).json(errorResponse);
});

// Server startup
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    console.log('🚀 Starting Gbewaa CLMS Server...\n');

    // Test database connection
    console.log('📊 Testing database connection...');
    const connectionSuccess = await testConnection();
    
    if (!connectionSuccess) {
      console.error('❌ Database connection failed. Exiting...');
      process.exit(1);
    }

    // Sync database (create tables if they don't exist)
    console.log('🔄 Synchronizing database...');
    await syncDatabase(false); // Don't force recreate in production
    console.log('✅ Database synchronized\n');

    // Start the server
    app.listen(PORT, () => {
      console.log('🎉 Server started successfully!');
      console.log(`📡 Server running on: http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📁 Database: ${process.env.DB_PATH || './database.sqlite'}`);
      console.log('\n📋 Available endpoints:');
      console.log(`   GET  /                    - API information`);
      console.log(`   GET  /health              - Health check`);
      console.log(`   POST /api/auth/login      - User login`);
      console.log(`   POST /api/auth/register   - User registration (Admin only)`);
      console.log(`   GET  /api/auth/profile    - Get user profile`);
      console.log(`   GET  /api/lands           - List land plots`);
      console.log(`   POST /api/lands           - Create land plot`);
      console.log(`   GET  /api/lands/available - Available land plots`);
      console.log(`   GET  /api/lands/statistics - Land plot statistics`);
      console.log('\n🔐 Authentication required for most endpoints');
      console.log('📖 See README.md for complete API documentation\n');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();