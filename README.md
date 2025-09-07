# 📝 Notes App API

A robust and secure REST API for a notes application with comprehensive user authentication, email verification, and JWT-based authorization.

## 🚀 Features

### ✅ Authentication System

- **User Registration** with email, phone, and password validation
- **Email OTP Verification** for secure account activation
- **JWT-based Login** with secure token generation
- **Password Hashing** using bcrypt with 12 rounds
- **Protected Routes** with authentication middleware
- **Rate Limiting** for security and abuse prevention

### 🔒 Security Features

- **Helmet.js** for security headers
- **CORS** configuration for cross-origin requests
- **Input Validation** using express-validator
- **Password Strength** requirements
- **Account Status** management
- **Request ID** tracking for debugging

### 📧 Email Service

- **OTP Generation** and verification
- **Welcome Emails** after successful registration
- **HTML Email Templates** with responsive design
- **Configurable Email Service** (Gmail, SMTP)

## 🛠️ Technology Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Nodemailer** - Email service
- **express-validator** - Input validation
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js          # MongoDB connection configuration
├── controllers/
│   └── authController.js    # Authentication logic
├── middleware/
│   └── authMiddleware.js    # JWT authentication middleware
├── models/
│   └── User.js              # User schema and methods
├── routes/
│   └── authRoutes.js        # Authentication routes
├── utils/
│   └── emailService.js      # Email service for OTP
├── .env                     # Environment variables
├── .gitignore              # Git ignore rules
├── package.json            # Dependencies and scripts
└── server.js               # Express server setup
```

## 🚀 Quick Start

### Prerequisites

- Node.js (>= 14.0.0)
- MongoDB (local or cloud instance)
- Email service credentials (Gmail recommended)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd notes-app-api
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp env.example .env
   ```

   Update `.env` with your configuration:

   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/notes-app

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=7d

   # Email Configuration
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=Notes App <noreply@notesapp.com>
   ```

4. **Start the server**

   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## 📚 API Documentation

### Base URL

```
http://localhost:3000
```

### Authentication Endpoints

#### 1. User Registration

```http
POST /api/auth/signup
Content-Type: application/json

{
  "fullName": "John Doe",
  "emailAddress": "john@example.com",
  "phoneNumber": "+1234567890",
  "password": "SecurePass123!"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully. Please check your email for verification code.",
  "data": {
    "user": {
      "id": "user_id",
      "fullName": "John Doe",
      "emailAddress": "john@example.com",
      "phoneNumber": "+1234567890",
      "isEmailVerified": false,
      "accountCreatedAt": "2024-01-01T00:00:00.000Z"
    },
    "emailSent": true,
    "requiresEmailVerification": true
  }
}
```

#### 2. Email OTP Verification

```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "emailAddress": "john@example.com",
  "otpCode": "123456"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Email verified successfully. Welcome to Notes App!",
  "data": {
    "user": {
      "id": "user_id",
      "fullName": "John Doe",
      "emailAddress": "john@example.com",
      "phoneNumber": "+1234567890",
      "isEmailVerified": true,
      "accountCreatedAt": "2024-01-01T00:00:00.000Z"
    },
    "authToken": "jwt_token_here",
    "tokenType": "Bearer"
  }
}
```

#### 3. User Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "emailAddress": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "fullName": "John Doe",
      "emailAddress": "john@example.com",
      "phoneNumber": "+1234567890",
      "isEmailVerified": true,
      "accountCreatedAt": "2024-01-01T00:00:00.000Z",
      "lastLoginAt": "2024-01-01T12:00:00.000Z"
    },
    "authToken": "jwt_token_here",
    "tokenType": "Bearer"
  }
}
```

#### 4. Get Current User Profile

```http
GET /api/auth/me
Authorization: Bearer <jwt_token>
```

#### 5. Test Protected Route

```http
GET /api/auth/protected
Authorization: Bearer <jwt_token>
```

#### 6. Resend OTP

```http
POST /api/auth/resend-otp
Content-Type: application/json

{
  "emailAddress": "john@example.com"
}
```

### Health Check

```http
GET /health
```

## 🔐 Authentication

### JWT Token Usage

Include the JWT token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Rate Limiting

- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes

## 🧪 Testing

### Manual Testing with cURL

1. **Register a new user:**

   ```bash
   curl -X POST http://localhost:3000/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{
       "fullName": "Test User",
       "emailAddress": "test@example.com",
       "phoneNumber": "+1234567890",
       "password": "TestPass123!"
     }'
   ```

2. **Verify email with OTP:**

   ```bash
   curl -X POST http://localhost:3000/api/auth/verify-otp \
     -H "Content-Type: application/json" \
     -d '{
       "emailAddress": "test@example.com",
       "otpCode": "123456"
     }'
   ```

3. **Login:**

   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "emailAddress": "test@example.com",
       "password": "TestPass123!"
     }'
   ```

4. **Access protected route:**

```bash
   curl -X GET http://localhost:3000/api/auth/protected \
     -H "Authorization: Bearer <your_jwt_token>"
```

## 🛡️ Security Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **JWT Secret**: Use a strong, random secret key
3. **Password Hashing**: bcrypt with 12 rounds minimum
4. **Rate Limiting**: Prevents brute force attacks
5. **Input Validation**: All inputs are validated and sanitized
6. **CORS**: Configured for specific origins
7. **Security Headers**: Helmet.js provides comprehensive protection

## 📧 Email Configuration

### Gmail Setup

1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password in `EMAIL_PASS`

### Other Email Services

Update the SMTP configuration in `.env`:

```env
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-password
```

## 🚀 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://your-production-db
JWT_SECRET=your-super-secure-production-secret
EMAIL_SERVICE=gmail
EMAIL_USER=your-production-email
EMAIL_PASS=your-production-app-password
```

### Docker Support (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the API documentation
- Review the error messages for debugging

---

**Happy Coding! 🎉**
