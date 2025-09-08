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

### 📝 Notes Management

- **Full CRUD Operations** for notes (Create, Read, Update, Delete)
- **Tag System** for organizing and categorizing notes
- **Tag Filtering** with single and multiple tag support
- **Search Functionality** across note titles and content
- **Note Pinning** for important notes
- **Note Archiving** for better organization
- **Owner Validation** - users can only access their own notes
- **Timestamps** with automatic created/updated tracking

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

### Notes Endpoints

#### 1. Create Note

```http
POST /api/notes
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "noteTitle": "My Important Note",
  "noteContent": "This is the content of my note...",
  "noteTags": ["work", "urgent", "meeting"]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Note created successfully",
  "data": {
    "note": {
      "_id": "note_id",
      "noteTitle": "My Important Note",
      "noteContent": "This is the content of my note...",
      "noteTags": ["work", "urgent", "meeting"],
      "noteOwner": "user_id",
      "isNotePinned": false,
      "isNoteArchived": false,
      "noteCreatedAt": "2024-01-01T00:00:00.000Z",
      "noteUpdatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### 2. Get All Notes

```http
GET /api/notes
Authorization: Bearer <jwt_token>
```

**Query Parameters:**

- `tag` - Filter by single tag
- `tags` - Filter by multiple tags (comma-separated)
- `limit` - Number of notes to return (default: 50)
- `skip` - Number of notes to skip (default: 0)
- `includeArchived` - Include archived notes (default: false)

**Examples:**

```http
GET /api/notes?tag=work
GET /api/notes?tags=work,urgent
GET /api/notes?limit=10&skip=0
```

#### 3. Get Note by ID

```http
GET /api/notes/:noteId
Authorization: Bearer <jwt_token>
```

#### 4. Update Note

```http
PUT /api/notes/:noteId
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "noteTitle": "Updated Title",
  "noteContent": "Updated content...",
  "noteTags": ["updated", "tags"],
  "isNotePinned": true,
  "isNoteArchived": false
}
```

#### 5. Delete Note

```http
DELETE /api/notes/:noteId
Authorization: Bearer <jwt_token>
```

#### 6. Search Notes

```http
GET /api/notes/search?q=search_term
Authorization: Bearer <jwt_token>
```

#### 7. Get Note Statistics

```http
GET /api/notes/stats
Authorization: Bearer <jwt_token>
```

**Response:**

```json
{
  "success": true,
  "message": "Note statistics retrieved successfully",
  "data": {
    "statistics": {
      "totalNotes": 25,
      "pinnedNotes": 3,
      "archivedNotes": 5,
      "totalTags": 12
    },
    "popularTags": [
      { "tag": "work", "count": 8 },
      { "tag": "personal", "count": 6 },
      { "tag": "urgent", "count": 4 }
    ]
  }
}
```

#### 8. Toggle Note Pin

```http
PATCH /api/notes/:noteId/pin
Authorization: Bearer <jwt_token>
```

#### 9. Toggle Note Archive

```http
PATCH /api/notes/:noteId/archive
Authorization: Bearer <jwt_token>
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

## 🌐 Frontend Interface

The project includes a beautiful, responsive web interface located in the `public/` directory:

### Features:

- **User Authentication** - Login and signup forms
- **Note Management** - Create, edit, delete, and organize notes
- **Tag System** - Add tags and filter notes by tags
- **Search Functionality** - Search through note titles and content
- **Note Statistics** - View your note statistics and popular tags
- **Responsive Design** - Works on desktop and mobile devices
- **Real-time Updates** - Dynamic content updates using Fetch API

### Access the Frontend:

1. Start the server: `npm run dev`
2. Open your browser: `http://localhost:3000`
3. The frontend will be served automatically from the `public/` directory

### Frontend Technologies:

- **Vanilla JavaScript** - No frameworks, pure JS with Fetch API
- **CSS3** - Modern styling with gradients and animations
- **Responsive Design** - Mobile-first approach
- **Local Storage** - JWT token persistence

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
```
