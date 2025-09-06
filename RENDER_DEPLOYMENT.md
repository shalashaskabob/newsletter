# Render Deployment Guide

## 🚀 Quick Deployment Steps

### 1. **Environment Variables**
Add your ScreenshotOne API key in Render:
```
SCREENSHOTONE_API_KEY=your-screenshotone-api-key
NODE_ENV=production
```

### 2. **Render Configuration**
- **Build Command**: `npm run render-build`
- **Start Command**: `npm run render-start`
- **Node Version**: 18.x or higher

### 3. **Deploy**
1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set the build and start commands above
4. Add your environment variables
5. Deploy!

## ✅ **What's Configured**

### **Package.json Scripts**
- `render-build`: Installs dependencies and builds the app
- `render-start`: Starts the Express server
- `start`: Runs the server (production mode)

### **Server Features**
- ✅ **Express server** serves React frontend
- ✅ **ScreenshotOne integration** (no Puppeteer)
- ✅ **CORS enabled** for API calls
- ✅ **Health check** endpoint at `/api/health`
- ✅ **Static file serving** from `/dist`

### **Frontend Features**
- ✅ **React app** with newsletter form
- ✅ **API calls** to `/api/generate-image`
- ✅ **localStorage** persistence
- ✅ **Professional KL branding**

## 🔧 **Local Testing**
```bash
npm run build        # Build the React app
npm run start        # Start the server
```

Visit `http://localhost:3002` to test locally.

## 🌐 **Production URL**
After deployment, your newsletter app will be available at your Render URL (e.g., `https://your-app-name.onrender.com`)

## 📝 **Notes**
- No Firebase dependencies
- No CSP issues
- Uses ScreenshotOne API for reliable image generation
- Single repository deployment
- Automatic HTTPS on Render
