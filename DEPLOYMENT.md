# 🚀 Deployment Guide

## Quick Deploy Options

### Option 1: Railway (Recommended)

1. **Sign up** at [railway.app](https://railway.app)
2. **Connect GitHub** repository
3. **Deploy** - Railway auto-detects Node.js
4. **Add environment variables**:
   - `MONGO_URI` - Your MongoDB connection string
   - `JWT_SECRET` - Your JWT secret key
   - `EMAIL_USER` - Your email username
   - `EMAIL_PASS` - Your email password

### Option 2: Render

1. **Sign up** at [render.com](https://render.com)
2. **Create Web Service**
3. **Connect GitHub** repository
4. **Configure**:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: `Node`

### Option 3: Vercel

1. **Sign up** at [vercel.com](https://vercel.com)
2. **Import project** from GitHub
3. **Configure**:
   - Framework: Other
   - Build Command: `cd backend && npm install`
   - Output Directory: `backend`
   - Install Command: `cd backend && npm install`

## Environment Variables Required

```bash
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/notes-app
JWT_SECRET=your-super-secret-jwt-key-here
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
NODE_ENV=production
```

## Database Setup

### MongoDB Atlas (Free)

1. **Create account** at [mongodb.com/atlas](https://mongodb.com/atlas)
2. **Create cluster** (free tier)
3. **Get connection string**
4. **Add to environment variables**

## Post-Deployment

1. **Test all endpoints**:

   - Health check: `https://your-app.railway.app/health`
   - Frontend: `https://your-app.railway.app/`
   - API: `https://your-app.railway.app/api/auth/signup`

2. **Verify features**:
   - User registration
   - Email OTP verification
   - Note CRUD operations
   - Authentication flow

## Troubleshooting

### Common Issues:

- **Port binding**: App uses `process.env.PORT || 3000` ✅
- **CORS**: Configured for all origins ✅
- **Static files**: Served from `/public` ✅
- **Environment**: Uses `.env` file ✅

### Debug Commands:

```bash
# Check if app starts locally
npm start

# Test health endpoint
curl http://localhost:3000/health

# Check environment variables
echo $MONGO_URI
```
