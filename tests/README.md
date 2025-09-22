# CLMS Test Suite

This directory contains all test files for the Custom Land Management System.

## 🧪 Available Tests

### Database & Models
- **`test-db.js`** - Database connection and synchronization
- **`test-user-model.js`** - User model validation and authentication
- **`test-landplot-model.js`** - Land plot model and status management
- **`test-transaction-model.js`** - Transaction model with relationships

### Services & Business Logic
- **`test-auth-service.js`** - Authentication service (register, login, JWT)
- **`test-land-service.js`** - Land management service (CRUD operations)

### Middleware & Security
- **`test-auth-middleware-simple.js`** - JWT middleware and role-based access

### API Endpoints
- **`test-auth-endpoints.js`** - Authentication API endpoints
- **`test-land-endpoints.js`** - Land management API endpoints

## 🚀 Running Tests

### Run Individual Tests
```bash
# Database connection test
node tests/test-db.js

# User model test
node tests/test-user-model.js

# Land service test
node tests/test-land-service.js

# Authentication endpoints test
node tests/test-auth-endpoints.js
```

### Run All Tests
```bash
# Run complete test suite
node tests/run-all-tests.js
```

## 📊 Test Coverage

### ✅ Fully Tested Components
- Database connection and setup
- User authentication and authorization
- Land plot CRUD operations
- JWT token management
- Role-based access control
- Input validation and error handling
- API endpoint functionality

### 🚧 Planned Tests
- Transaction management
- PDF receipt generation
- Reporting system
- Integration tests
- Performance tests

## 🔍 Test Structure

Each test file follows this pattern:
1. **Setup** - Database connection and sync
2. **Test Cases** - Individual functionality tests
3. **Error Handling** - Testing error scenarios
4. **Cleanup** - Process exit

## 📝 Test Output

Tests provide detailed output including:
- ✅ Success indicators
- ❌ Error messages with details
- 📊 Statistics and summaries
- 🔍 SQL query logs (in development)

## 🛠️ Adding New Tests

When adding new tests:
1. Follow the existing naming convention: `test-[component].js`
2. Include comprehensive error handling tests
3. Add the test to `run-all-tests.js`
4. Update this README with test description