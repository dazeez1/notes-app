# 📝 Notes App API

A comprehensive notes management API built with Node.js, Express, and MongoDB. Features user authentication with JWT, email OTP verification, full CRUD operations for notes, tag filtering, and a modern frontend interface.

## 🚀 Features

### Authentication & Security

- **User Registration** with phone number validation
- **Email OTP Verification** for account activation
- **JWT Authentication** with Bearer token
- **Password Hashing** using bcrypt
- **Rate Limiting** for security
- **Input Validation** with express-validator
- **CORS Protection** and security headers

### Notes Management

- **Full CRUD Operations** (Create, Read, Update, Delete)
- **Tag Filtering** with single and multiple tag support
- **Note Search** by title and content
- **Note Statistics** and analytics
- **Pin/Unpin** functionality
- **Archive/Unarchive** notes
- **Owner-based Access Control**

### Frontend Integration

- **Complete Testing Interface** with all API endpoints
- **Real-time Note Management** using Fetch API with headers
- **JWT Token Handling** with automatic authentication
- **Form Validation** and comprehensive error handling
- **Dynamic Content Loading** with loading states
- **Response Logging** for API debugging

## 📁 Project Structure

```
notes-app/
├── backend/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   └── noteController.js    # Notes CRUD operations
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT authentication
│   ├── models/
│   │   ├── User.js              # User schema
│   │   └── Note.js              # Note schema
│   ├── routes/
│   │   ├── authRoutes.js        # Authentication routes
│   │   └── noteRoutes.js        # Notes routes
│   ├── utils/
│   │   └── emailService.js      # Email OTP service
│   ├── .env                      # Environment variables
│   ├── package.json              # Dependencies
│   └── server.js                 # Main server file
├── public/
│   ├── index.html                # Frontend testing interface
│   ├── script.js                 # Complete API testing functionality
│   └── styles.css                # Modern responsive styling
└── README.md                     # This file
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js (v14+)
- MongoDB Atlas account or local MongoDB
- Gmail account for email OTP

### 1. Clone the Repository

```bash
git clone https://github.com/dazeez1/notes-app.git
cd notes-app
```

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Environment Configuration

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/notes-app
MONGODB_URI_TEST=mongodb://localhost:27017/notes-app-test

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Security
BCRYPT_ROUNDS=12

# Email Configuration (for OTP verification)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Notes App <noreply@notesapp.com>
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

### 4. Start the Server

```bash
npm start
# or for development
npm run dev
```

### 5. Access the Application

- **Frontend Interface**: http://localhost:3000/
- **API Documentation**: http://localhost:3000/ (JSON format)
- **Health Check**: http://localhost:3000/health

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api
```

### Authentication Endpoints

#### Register User

```http
POST /api/auth/signup
Content-Type: application/json

{
  "fullName": "John Doe",
  "emailAddress": "john@example.com",
  "phoneNumber": "1234567890",
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
      "phoneNumber": "1234567890",
      "isEmailVerified": false
    },
    "emailSent": true,
    "requiresEmailVerification": true
  }
}
```

#### Verify Email OTP

```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "emailAddress": "john@example.com",
  "otpCode": "123456"
}
```

#### Login User

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
      "phoneNumber": "1234567890",
      "isEmailVerified": true
    },
    "authToken": "jwt_token_here",
    "tokenType": "Bearer"
  }
}
```

#### Get User Profile

```http
GET /api/auth/me
Authorization: Bearer <jwt_token>
```

### Notes Endpoints

#### Create Note

```http
POST /api/notes
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "noteTitle": "My First Note",
  "noteContent": "This is the content of my note",
  "noteTags": ["work", "important"]
}
```

#### Get All Notes

```http
GET /api/notes
Authorization: Bearer <jwt_token>
```

**Query Parameters:**

- `tag` - Filter by single tag: `?tag=work`
- `tags` - Filter by multiple tags: `?tags=work,urgent`
- `limit` - Number of notes per page: `?limit=10`
- `skip` - Number of notes to skip: `?skip=0`
- `includeArchived` - Include archived notes: `?includeArchived=true`

**Example:**

```http
GET /api/notes?tag=work&limit=10&skip=0
Authorization: Bearer <jwt_token>
```

#### Get Single Note

```http
GET /api/notes/:noteId
Authorization: Bearer <jwt_token>
```

#### Update Note

```http
PUT /api/notes/:noteId
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "noteTitle": "Updated Title",
  "noteContent": "Updated content",
  "noteTags": ["updated", "tags"],
  "isNotePinned": true,
  "isNoteArchived": false
}
```

#### Delete Note

```http
DELETE /api/notes/:noteId
Authorization: Bearer <jwt_token>
```

#### Search Notes

```http
GET /api/notes/search?q=search_term
Authorization: Bearer <jwt_token>
```

#### Get Note Statistics

```http
GET /api/notes/stats
Authorization: Bearer <jwt_token>
```

#### Toggle Note Pin

```http
PATCH /api/notes/:noteId/pin
Authorization: Bearer <jwt_token>
```

#### Toggle Note Archive

```http
PATCH /api/notes/:noteId/archive
Authorization: Bearer <jwt_token>
```

## 🔒 Security Features

### Authentication

- JWT tokens with 7-day expiration
- Password hashing with bcrypt (12 rounds)
- Email verification required for account activation

### Rate Limiting

- General API: 100 requests per 15 minutes
- Authentication routes: 50 requests per 15 minutes

### Input Validation

- Email format validation
- Phone number format validation
- Password strength requirements
- Note title/content length limits
- Tag format validation

### Security Headers

- CORS protection
- Helmet security headers
- Request ID tracking

## 🎯 Usage Examples

### Frontend Web Interface

Access the complete testing interface at **http://localhost:3000/**

#### ✨ Features Available:

- **🔐 Authentication**: Full signup/login flow with OTP verification
- **📝 Notes Management**: Create, edit, delete, pin, archive notes
- **🔍 Search & Filter**: Real-time search and tag filtering
- **📊 Statistics**: View note statistics and analytics
- **🧪 API Testing**: Test all endpoints with live responses
- **📋 Response Logging**: Debug API calls in real-time

#### 📱 Form Validation:

- **Name**: 2-50 characters, letters/spaces/hyphens/apostrophes only
- **Email**: Valid email format required
- **Phone**: Valid international phone number format
- **Password**: Minimum 8 characters, must include uppercase, lowercase, and number
- **Note Title**: 1-100 characters, alphanumeric with common punctuation
- **Note Content**: 1-10,000 characters
- **Tags**: Max 10 tags, 1-20 characters each, letters/numbers/hyphens only

### API Testing with cURL

#### Login and Get Token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailAddress":"test@example.com","password":"TestPass123!"}'
```

#### Create Note with Tags

```bash
curl -X POST http://localhost:3000/api/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"noteTitle":"My Note","noteContent":"Note content","noteTags":["work","urgent"]}'
```

#### Filter Notes by Tags

```bash
curl -X GET "http://localhost:3000/api/notes?tag=work" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🧪 Testing

### Manual Testing

1. **Register** a new user account using the signup endpoint
2. **Check email** for OTP verification code
3. **Verify email** with OTP using the verify-otp endpoint
4. **Login** with credentials to get JWT token
5. **Create notes** with different tags using the notes endpoint
6. **Filter notes** by tags using query parameters
7. **Update and delete** notes using their IDs

### Test Credentials

For testing purposes, you can use:

- **Email**: test@example.com
- **Password**: TestPass123!

## 🚀 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/notes-app-prod
JWT_SECRET=your-production-jwt-secret
EMAIL_USER=your-production-email@gmail.com
EMAIL_PASS=your-production-app-password
```

### MongoDB Atlas Setup

1. Create a MongoDB Atlas cluster
2. Configure network access (IP whitelist)
3. Create database user with read/write permissions
4. Update `MONGODB_URI` in environment variables

## 📝 API Response Format

All API responses follow this format:

```json
{
  "success": true|false,
  "message": "Human readable message",
  "data": {
    // Response data here
  },
  "error": "ERROR_CODE" // Only present on errors
}
```

## 🔧 Development

### Available Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests
npm run lint       # Run ESLint
npm run format     # Format code with Prettier
```

### Database Indexes

The application includes optimized MongoDB indexes:

- User email and phone number (unique)
- Note owner and tags (compound)
- Note creation date (for sorting)
- Text search on title and content

## 📄 License

This project is licensed under the MIT License.
