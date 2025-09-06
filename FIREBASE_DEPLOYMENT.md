# Firebase Deployment Guide

## Prerequisites
- Firebase CLI installed: `npm install -g firebase-tools`
- Existing Firebase project
- Custom domain already configured in Firebase Hosting

## Deployment Steps

### 1. Initialize Firebase (if not already done)
```bash
firebase login
firebase init
```

Select:
- ✅ Hosting: Configure files for Firebase Hosting
- ✅ Functions: Configure a Cloud Functions directory
- Choose your existing Firebase project
- Use `dist` as public directory
- Configure as single-page app: **Yes**
- Set up automatic builds: **No**

### 2. Install Function Dependencies
```bash
cd functions
npm install
cd ..
```

### 3. Build the Project
```bash
npm run build
```

### 4. Deploy to Firebase
```bash
# Deploy everything
firebase deploy

# Or deploy separately:
firebase deploy --only hosting    # Deploy frontend only
firebase deploy --only functions  # Deploy backend only
```

### 5. Access Your App
Your newsletter creator will be available at:
- `https://yourdomain.com/newsletter/`
- `https://yourproject.web.app/newsletter/`

## Configuration

### Firebase Hosting Rewrites
The `firebase.json` is configured to:
- Serve the newsletter app at `/newsletter/**`
- Route API calls to Cloud Functions at `/api/**`
- Handle React routing properly

### Environment Variables
If you need environment variables for Cloud Functions:
```bash
firebase functions:config:set someservice.key="THE API KEY"
```

## Local Development with Firebase

### Start Firebase Emulators
```bash
# Start both hosting and functions emulators
firebase emulators:start

# Your app will be at: http://localhost:5000/newsletter/
```

### Development with Hot Reload
```bash
# Terminal 1: Start Vite dev server
npm run dev

# Terminal 2: Start functions emulator
cd functions && npm run serve

# Access at: http://localhost:3000 (Vite) or http://localhost:5000/newsletter/ (Firebase)
```

## Troubleshooting

### Functions Timeout
If image generation times out, increase the timeout in `functions/src/index.ts`:
```typescript
export const api = functions.runWith({
  timeoutSeconds: 300,
  memory: '1GB'
}).https.onRequest(app);
```

### Puppeteer Issues
Cloud Functions should handle Puppeteer automatically, but if you get errors:
1. Make sure you're using the correct Puppeteer args (already configured)
2. Consider using `puppeteer-core` instead of `puppeteer`

### CORS Issues
The functions are configured with `cors({ origin: true })` which should handle all origins.

### Build Issues
If the build fails:
```bash
# Clean and rebuild
rm -rf dist functions/lib
npm run build
cd functions && npm run build && cd ..
firebase deploy
```

## Custom Domain Setup
Since you already have a domain configured:
1. The app will be available at `yourdomain.com/newsletter/`
2. All API calls will go to `yourdomain.com/api/`
3. No additional domain configuration needed

## Cost Considerations
- Firebase Hosting: Free (generous limits)
- Cloud Functions: Pay per invocation (very cheap for this use case)
- Puppeteer image generation: ~1-2 seconds per image
- Estimated cost: $0.01-0.05 per newsletter generated
