# KL Newsletter Creator - Deployment Guide

## Option 1: Render.com (Recommended - Easiest)

### Steps:
1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/newsletter-creator.git
   git push -u origin main
   ```

2. **Deploy on Render**:
   - Go to [render.com](https://render.com) and sign up
   - Click "New +" → "Web Service"
   - Connect your GitHub repo
   - Configure:
     - **Build Command**: `npm run build`
     - **Start Command**: `npm start`
     - **Node Version**: 18 or higher
   - Click "Create Web Service"

3. **Done!** Your app will be live at `https://your-app-name.onrender.com`

---

## Option 2: Railway.app

### Steps:
1. Push to GitHub (same as above)
2. Go to [railway.app](https://railway.app)
3. Click "Deploy from GitHub"
4. Select your repo
5. Railway auto-detects Node.js and deploys!

---

## Option 3: Vercel (Frontend) + Railway (Backend)

### Frontend (Vercel):
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repo
3. Vercel auto-deploys the React app

### Backend (Railway):
1. Create a separate repo with just the `server/` folder
2. Deploy on Railway as above
3. Update your React app's API calls to point to the Railway backend URL

---

## Environment Variables

For production, you may want to set:
- `NODE_ENV=production`
- `PORT=3000` (or whatever your host provides)

---

## Local Testing Before Deployment

```bash
# Build the production version
npm run build

# Test the production build locally
npm run build-and-serve
```

Visit `http://localhost:3002` to test the production build.

---

## Troubleshooting

### Puppeteer Issues on Render/Railway:
If you get Puppeteer errors, the hosting platform will automatically install the required dependencies. Both Render and Railway support Puppeteer out of the box.

### CORS Issues:
The app is configured to work in production. If you encounter CORS issues, make sure your frontend is making requests to the correct backend URL.

### Build Failures:
Make sure all dependencies are in `package.json` and not just `devDependencies` if they're needed for the build.
