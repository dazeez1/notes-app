const mongoose = require("mongoose");

/**
 * Database connection configuration
 * Handles MongoDB connection with proper error handling and connection events
 */
class DatabaseConnection {
  constructor() {
    this.isConnected = false;
  }

  /**
   * Connect to MongoDB database
   * @returns {Promise<void>}
   */
  async connect() {
    try {
      const mongoUri =
        process.env.MONGODB_URI || "mongodb://localhost:27017/notes-app";

      // Connection options for better performance and security
      const options = {
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      };

      await mongoose.connect(mongoUri, options);

      this.isConnected = true;
      console.log("✅ Database connected successfully");

      // Handle connection events
      this.setupConnectionEvents();
    } catch (error) {
      console.error("❌ Database connection failed:", error.message);
      process.exit(1);
    }
  }

  /**
   * Setup MongoDB connection event listeners
   */
  setupConnectionEvents() {
    const db = mongoose.connection;

    db.on("error", (error) => {
      console.error("❌ Database error:", error);
      this.isConnected = false;
    });

    db.on("disconnected", () => {
      console.log("⚠️  Database disconnected");
      this.isConnected = false;
    });

    db.on("reconnected", () => {
      console.log("✅ Database reconnected");
      this.isConnected = false;
    });

    // Handle application termination
    process.on("SIGINT", async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  /**
   * Disconnect from MongoDB
   * @returns {Promise<void>}
   */
  async disconnect() {
    try {
      await mongoose.connection.close();
      this.isConnected = false;
      console.log("✅ Database disconnected gracefully");
    } catch (error) {
      console.error("❌ Error disconnecting from database:", error.message);
    }
  }

  /**
   * Get connection status
   * @returns {boolean}
   */
  getConnectionStatus() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }
}

// Create singleton instance
const databaseConnection = new DatabaseConnection();

module.exports = databaseConnection;
