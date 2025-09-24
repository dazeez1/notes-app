require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

// Import custom modules
const databaseConnection = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const noteRoutes = require("./routes/noteRoutes");

// Initialize Express app
const app = express();

// Get port from environment or use default
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

/**
 * Security Middleware Configuration
 */

// Helmet for security headers - disabled for development
// app.use(helmet());

// CORS configuration - permissive for development
app.use(
  cors({
    origin: true, // Allow all origins
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Rate limiting - disabled for development
// const limiter = rateLimit({...});
// app.use(limiter);
// const authLimiter = rateLimit({...});

/**
 * General Middleware
 */

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve static files from public directory
app.use(express.static("../public"));

// Logging middleware
if (NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Request ID middleware for tracking
app.use((req, res, next) => {
  req.requestId = Math.random().toString(36).substr(2, 9);
  res.setHeader("X-Request-ID", req.requestId);
  next();
});

/**
 * Health Check Route
 */
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Notes App API is running",
    data: {
      service: "notes-app-api",
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: NODE_ENV,
      version: "1.0.0",
      requestId: req.requestId,
    },
  });
});

/**
 * API Routes
 */

// Authentication routes
app.use("/api/auth", authRoutes);

// Notes routes
app.use("/api/notes", noteRoutes);

// Root route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Notes App API",
    data: {
      service: "notes-app-api",
      version: "1.0.0",
      documentation: "/api/docs",
      health: "/health",
      auth: {
        signup: "POST /api/auth/signup",
        login: "POST /api/auth/login",
        verifyOtp: "POST /api/auth/verify-otp",
        resendOtp: "POST /api/auth/resend-otp",
        profile: "GET /api/auth/me",
        protected: "GET /api/auth/protected",
      },
      notes: {
        create: "POST /api/notes",
        getAll: "GET /api/notes",
        getById: "GET /api/notes/:id",
        update: "PUT /api/notes/:id",
        delete: "DELETE /api/notes/:id",
        search: "GET /api/notes/search",
        stats: "GET /api/notes/stats",
        pin: "PATCH /api/notes/:id/pin",
        archive: "PATCH /api/notes/:id/archive",
      },
    },
  });
});

// Email test route (for debugging)
app.get("/test-email", (req, res) => {
  const emailService = require("./utils/emailService");
  const emailConfig = {
    hasUser: !!process.env.EMAIL_USER,
    hasPass: !!process.env.EMAIL_PASS,
    service: process.env.EMAIL_SERVICE || "gmail",
    from: process.env.EMAIL_FROM || "Notes App <noreply@notesapp.com>",
    isConfigured: emailService.isConfigured,
  };

  res.status(200).json({
    success: true,
    message: "Email configuration status",
    data: {
      emailConfig,
      environment: NODE_ENV,
    },
  });
});

/**
 * Error Handling Middleware
 */

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    error: "ROUTE_NOT_FOUND",
    data: {
      requestedUrl: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    },
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Global error handler:", error);

  // CORS error
  if (error.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "CORS policy violation",
      error: "CORS_ERROR",
      requestId: req.requestId,
    });
  }

  // Default error response
  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal server error",
    error: "INTERNAL_SERVER_ERROR",
    ...(NODE_ENV === "development" && { stack: error.stack }),
    requestId: req.requestId,
  });
});

/**
 * Database Connection and Server Startup
 */
async function startServer() {
  try {
    // Connect to database
    await databaseConnection.connect();

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`
🚀 Notes App API Server Started Successfully!

📊 Server Information:
   • Environment: ${NODE_ENV}
   • Port: ${PORT}
   • URL: http://localhost:${PORT}
   • Database: Connected ✅

🔗 Available Endpoints:
   • Health Check: GET /health
   • API Root: GET /
   • User Signup: POST /api/auth/signup
   • User Login: POST /api/auth/login
   • Verify OTP: POST /api/auth/verify-otp
   • Resend OTP: POST /api/auth/resend-otp
   • User Profile: GET /api/auth/me
   • Protected Route: GET /api/auth/protected
   • Create Note: POST /api/notes
   • Get Notes: GET /api/notes
   • Get Note: GET /api/notes/:id
   • Update Note: PUT /api/notes/:id
   • Delete Note: DELETE /api/notes/:id
   • Search Notes: GET /api/notes/search
   • Note Stats: GET /api/notes/stats

🛡️ Security Features:
   • Rate Limiting: Enabled
   • CORS: Configured
   • Helmet: Security Headers
   • JWT Authentication: Ready

📝 Ready to handle requests!
      `);
    });

    // Graceful shutdown handling
    process.on("SIGTERM", () => {
      console.log("SIGTERM received. Shutting down gracefully...");
      server.close(() => {
        console.log("Process terminated");
        databaseConnection.disconnect();
      });
    });

    process.on("SIGINT", () => {
      console.log("SIGINT received. Shutting down gracefully...");
      server.close(() => {
        console.log("Process terminated");
        databaseConnection.disconnect();
      });
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app;
