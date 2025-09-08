#!/bin/bash

# Notes App - Frontend Server Startup Script
# This script helps you run the frontend properly to avoid CORS issues

echo "🚀 Starting Notes App Frontend Server..."
echo ""

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    echo "✅ Python 3 found"
    echo "📡 Starting HTTP server on port 8080..."
    echo "🌐 Frontend will be available at: http://localhost:8080"
    echo ""
    echo "💡 Make sure the backend is running on port 3000"
    echo "   Run: cd backend && npm start"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    # Start the server
    python3 -m http.server 8080 --directory public
elif command -v python &> /dev/null; then
    echo "✅ Python found"
    echo "📡 Starting HTTP server on port 8080..."
    echo "🌐 Frontend will be available at: http://localhost:8080"
    echo ""
    echo "💡 Make sure the backend is running on port 3000"
    echo "   Run: cd backend && npm start"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    # Start the server
    python -m http.server 8080 --directory public
else
    echo "❌ Python not found. Please install Python to run the frontend server."
    echo ""
    echo "Alternative options:"
    echo "1. Install Python: https://www.python.org/downloads/"
    echo "2. Use Node.js: npx http-server public -p 8080"
    echo "3. Use any other web server to serve the 'public' directory"
    exit 1
fi
