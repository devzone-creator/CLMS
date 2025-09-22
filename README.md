# Custom Land Management System (CLMS)

A comprehensive backend API system for managing land plots, tracking sales transactions, calculating commissions, and generating reports for Gbewaa Palace.

## 🏗️ Architecture

The CLMS is built with Node.js and Express.js, using SQLite for data persistence and JWT for authentication. The system follows a layered architecture with clear separation of concerns.

### Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite (lightweight, file-based)
- **ORM**: Sequelize
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **PDF Generation**: PDFKit
- **Environment Management**: dotenv

## 📁 Project Structure

```
gbewaa-clms/
├── config/
│   └── db.js                 # Database configuration
├── controllers/
│   ├── authController.js     # Authentication endpoints
│   ├── landController.js     # Land management endpoints
│   ├── transactionController.js # Transaction endpoints (planned)
│   └── reportsController.js  # Reporting endpoints (planned)
├── middlewares/
│   ├── auth.js              # JWT verification & role-based access
│   └── validation.js        # Input validation utilities
├── models/
│   ├── index.js             # Model relationships
│   ├── User.js              # User model with roles
│   ├── LandPlot.js          # Land plot model
│   └── Transaction.js       # Transaction model
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── lands.js             # Land management routes
│   ├── transactions.js      # Transaction routes (planned)
│   └── reports.js           # Reports routes (planned)
├── services/
│   ├── authService.js       # Authentication business logic
│   ├── landService.js       # Land management business logic
│   ├── transactionService.js # Transaction business logic (planned)
│   └── reportsService.js    # Reports business logic (planned)
├── tests/                   # Test files
├── utils/                   # Utility functions
├── .env                     # Environment variables
├── database.sqlite          # SQLite database file
├── package.json             # Dependencies and scripts
└── server.js                # Application entry point
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd clms
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Initialize the database**
   ```bash
   node tests/test-db.js
   ```

5. **Start the server**
   ```bash
   npm run dev  # Development mode with nodemon
   # or
   npm start    # Production mode
   ```

The server will start on `http://localhost:3000`

## 🔐 Authentication & Authorization

### User Roles

- **ADMIN**: Full system access including user management
- **STAFF**: Land management, transaction recording, receipt generation
- **AUDITOR**: Read-only access to reports and transaction data

### Authentication Flow

1. **Login**: `POST /api/auth/login`
2. **Get JWT token**: Include in Authorization header as `Bearer <token>`
3. **Access protected routes**: Token verified on each request

### Initial Setup

Create the first admin user:
```bash
node tests/test-auth-service.js
```

## 📊 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/auth/login` | User login | Public |
| POST | `/api/auth/register` | Create new user | Admin only |
| GET | `/api/auth/profile` | Get user profile | Private |
| POST | `/api/auth/refresh` | Refresh JWT token | Private |
| PUT | `/api/auth/change-password` | Change password | Private |

### Land Management Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/lands` | Create land plot | Admin/Staff |
| GET | `/api/lands` | List all land plots | All users |
| GET | `/api/lands/:id` | Get land plot by ID | All users |
| PUT | `/api/lands/:id` | Update land plot | Admin/Staff |
| GET | `/api/lands/available` | Get available plots | All users |
| PATCH | `/api/lands/:id/mark-sold` | Mark plot as sold | Admin/Staff |
| GET | `/api/lands/statistics` | Get plot statistics | All users |

### Query Parameters for Land Endpoints

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `status`: Filter by status (AVAILABLE, SOLD, DISPUTED, RESERVED)
- `location`: Filter by location (partial match)
- `sortBy`: Sort field (plotNumber, location, size, status, etc.)
- `sortOrder`: Sort order (ASC, DESC)

## 🏞️ Land Plot Management

### Land Plot Statuses

- **AVAILABLE**: Ready for sale
- **SOLD**: Transaction completed
- **DISPUTED**: Under dispute resolution
- **RESERVED**: Reserved for specific buyer

### Size Units

- **ACRES**: Imperial measurement
- **HECTARES**: Metric measurement
- **SQ_METERS**: Square meters

## 🧪 Testing

### Running Tests

```bash
# Test database connection
node tests/test-db.js

# Test user model
node tests/test-user-model.js

# Test land plot model
node tests/test-landplot-model.js

# Test transaction model
node tests/test-transaction-model.js

# Test authentication service
node tests/test-auth-service.js

# Test authentication middleware
node tests/test-auth-middleware-simple.js

# Test land service
node tests/test-land-service.js

# Test land endpoints
node tests/test-land-endpoints.js

# Test authentication endpoints
node tests/test-auth-endpoints.js
```

### Test Coverage

- ✅ Database connection and synchronization
- ✅ User model with authentication
- ✅ Land plot model with validation
- ✅ Transaction model with relationships
- ✅ Authentication service (register, login, JWT)
- ✅ Authentication middleware (token verification, roles)
- ✅ Land service (CRUD operations)
- ✅ Land controller (API endpoints)
- ✅ Error handling and validation

## 📈 Current Implementation Status

### ✅ Completed Features

- **Database Setup**: SQLite with Sequelize ORM
- **User Management**: Registration, authentication, role-based access
- **Land Management**: Full CRUD operations with filtering and pagination
- **Security**: JWT authentication, password hashing, input validation
- **Testing**: Comprehensive test suite for all implemented features

### 🚧 In Progress / Planned Features

- **Transaction Management**: Sales recording with commission calculation
- **PDF Receipt Generation**: Automated receipt creation
- **Reporting System**: Business analytics and summaries
- **API Documentation**: Swagger/OpenAPI documentation
- **Frontend Interface**: Web dashboard (future phase)

## 🔧 Configuration

### Environment Variables

```env
# Database Configuration
DB_PATH=./database.sqlite
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3000

# Application Settings
COMMISSION_RATE=0.10
```

### Database

The system uses SQLite for simplicity and portability:
- **File**: `database.sqlite` (created automatically)
- **No server setup required**
- **Easy backup**: Just copy the database file
- **Development friendly**: Reset by deleting the file

## 🛡️ Security Features

- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Tokens**: Secure authentication with expiration
- **Role-Based Access**: Different permissions for different user types
- **Input Validation**: Prevent SQL injection and malicious data
- **Error Handling**: Secure error messages without sensitive data exposure

## 📝 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": [] // Optional validation details
  }
}
```

## 🤝 Contributing

1. Follow the existing code structure and patterns
2. Write tests for new features
3. Use meaningful commit messages
4. Update documentation for API changes

## 📄 License

This project is proprietary software for Gbewaa Palace.

## 🆘 Support

For technical support or questions:
- Check the test files for usage examples
- Review the API endpoint documentation above
- Examine the service layer for business logic implementation

---

**Built with ❤️ for Gbewaa Palace Land Management**
