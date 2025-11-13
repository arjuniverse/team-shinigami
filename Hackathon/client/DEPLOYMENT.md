# Deployment Guide - DID Vault Client

Guide for deploying the DID Vault client to production.

## Pre-Deployment Checklist

### 1. Environment Configuration
- [ ] Firebase project created and configured
- [ ] All environment variables documented
- [ ] Production Firebase config obtained
- [ ] Issuer backend deployed and accessible
- [ ] HTTPS enabled on all services

### 2. Security Review
- [ ] Firebase security rules configured
- [ ] API keys properly secured
- [ ] CORS configured on backend
- [ ] Rate limiting enabled
- [ ] Firebase App Check enabled (recommended)

### 3. Testing
- [ ] All features tested in staging
- [ ] Mobile responsive design verified
- [ ] Cross-browser testing completed
- [ ] Accessibility audit passed
- [ ] Performance testing done

### 4. Build Optimization
- [ ] Production build tested locally
- [ ] Bundle size optimized
- [ ] Assets compressed
- [ ] Source maps configured

## Deployment Platforms

### Option 1: Vercel (Recommended)

Vercel provides the easiest deployment with automatic HTTPS and CDN.

#### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 2: Login to Vercel
```bash
vercel login
```

#### Step 3: Deploy
```bash
cd client
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- Project name? **did-vault-client**
- Directory? **./client** (or just press Enter if already in client folder)
- Override settings? **N**

#### Step 4: Configure Environment Variables

In Vercel Dashboard:
1. Go to your project
2. Settings → Environment Variables
3. Add all variables from `.env`:
   ```
   VITE_ISSUER_API_URL=https://your-issuer-api.com
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

#### Step 5: Redeploy
```bash
vercel --prod
```

#### Step 6: Configure Custom Domain (Optional)
1. Go to Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Add domain to Firebase authorized domains

### Option 2: Netlify

#### Step 1: Install Netlify CLI
```bash
npm install -g netlify-cli
```

#### Step 2: Login
```bash
netlify login
```

#### Step 3: Initialize
```bash
cd client
netlify init
```

#### Step 4: Configure Build Settings
Create `netlify.toml` in client folder:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Step 5: Deploy
```bash
netlify deploy --prod
```

#### Step 6: Configure Environment Variables
```bash
netlify env:set VITE_ISSUER_API_URL "https://your-issuer-api.com"
netlify env:set VITE_FIREBASE_API_KEY "your_key"
# ... add all other variables
```

### Option 3: Firebase Hosting

#### Step 1: Install Firebase CLI
```bash
npm install -g firebase-tools
```

#### Step 2: Login
```bash
firebase login
```

#### Step 3: Initialize Hosting
```bash
cd client
firebase init hosting
```

Select:
- Use existing project (your Firebase project)
- Public directory: **dist**
- Single-page app: **Yes**
- Set up automatic builds: **No**

#### Step 4: Build
```bash
npm run build
```

#### Step 5: Deploy
```bash
firebase deploy --only hosting
```

### Option 4: AWS Amplify

#### Step 1: Install Amplify CLI
```bash
npm install -g @aws-amplify/cli
```

#### Step 2: Configure Amplify
```bash
amplify configure
```

#### Step 3: Initialize
```bash
cd client
amplify init
```

#### Step 4: Add Hosting
```bash
amplify add hosting
```

Select:
- Hosting with Amplify Console
- Manual deployment

#### Step 5: Publish
```bash
amplify publish
```

## Post-Deployment Configuration

### 1. Update Firebase Authorized Domains

1. Go to Firebase Console
2. Authentication → Settings → Authorized domains
3. Add your production domain:
   - `your-app.vercel.app`
   - `your-custom-domain.com`

### 2. Configure CORS on Issuer Backend

Update issuer backend to allow your production domain:

```javascript
// issuer/index.js
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://your-app.vercel.app',
    'https://your-custom-domain.com'
  ],
  credentials: true
}));
```

### 3. Update Environment Variables

Ensure all production URLs are correct:
- `VITE_ISSUER_API_URL` points to production backend
- Firebase config uses production project
- No development/test credentials

### 4. Enable Firebase App Check (Recommended)

1. Go to Firebase Console → App Check
2. Register your app
3. Select reCAPTCHA v3 for web
4. Add site key to your app
5. Enforce App Check on backend

## Performance Optimization

### 1. Enable Compression

Most platforms enable this by default, but verify:
- Gzip/Brotli compression enabled
- Static assets cached
- CDN configured

### 2. Optimize Bundle Size

If bundle is too large (>500KB warning):

```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase': ['firebase/app', 'firebase/auth'],
          'ui': ['@headlessui/react', '@heroicons/react', 'framer-motion']
        }
      }
    }
  }
}
```

### 3. Enable Source Maps (Optional)

For production debugging:

```javascript
// vite.config.js
export default {
  build: {
    sourcemap: true
  }
}
```

## Monitoring and Analytics

### 1. Firebase Analytics

Add to `src/firebase/firebaseConfig.js`:

```javascript
import { getAnalytics } from 'firebase/analytics';

const analytics = getAnalytics(app);
```

### 2. Error Tracking

Install Sentry:

```bash
npm install @sentry/react
```

Configure in `src/main.jsx`:

```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: import.meta.env.MODE,
});
```

### 3. Performance Monitoring

Use Firebase Performance Monitoring:

```javascript
import { getPerformance } from 'firebase/performance';

const perf = getPerformance(app);
```

## Security Hardening

### 1. Content Security Policy

Add to `index.html`:

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' https://apis.google.com; 
               style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
               font-src 'self' https://fonts.gstatic.com;
               connect-src 'self' https://*.firebaseio.com https://*.googleapis.com;">
```

### 2. Security Headers

Configure in your hosting platform:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### 3. Firebase Security Rules

For Firestore (if using):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Continuous Deployment

### GitHub Actions (Vercel)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd client && npm install
      - name: Build
        run: cd client && npm run build
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./client
```

## Rollback Strategy

### Vercel
```bash
vercel rollback
```

### Netlify
```bash
netlify rollback
```

### Manual Rollback
1. Keep previous build artifacts
2. Redeploy previous version
3. Update environment variables if needed

## Health Checks

### 1. Automated Monitoring

Use services like:
- UptimeRobot
- Pingdom
- StatusCake

Monitor:
- Homepage availability
- API connectivity
- Authentication flow

### 2. Manual Checks

After deployment, verify:
- [ ] Homepage loads
- [ ] Sign up works
- [ ] Login works
- [ ] Upload works
- [ ] Vault loads
- [ ] Verification works
- [ ] Dark mode toggles
- [ ] Mobile view works

## Troubleshooting

### Build Fails

**Check:**
- Node version (18+)
- All dependencies installed
- Environment variables set
- No syntax errors

### Firebase Auth Errors

**Check:**
- Domain added to authorized domains
- Firebase config correct
- API keys valid
- Auth methods enabled

### CORS Errors

**Check:**
- Backend CORS configuration
- Correct API URL in environment
- HTTPS enabled
- Credentials included in requests

### 404 on Refresh

**Solution:** Configure SPA routing

Vercel: Add `vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Netlify: Add to `netlify.toml`:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Cost Estimation

### Vercel
- **Hobby (Free):** 100GB bandwidth, unlimited requests
- **Pro ($20/month):** 1TB bandwidth, advanced features

### Netlify
- **Starter (Free):** 100GB bandwidth, 300 build minutes
- **Pro ($19/month):** 1TB bandwidth, 1000 build minutes

### Firebase Hosting
- **Spark (Free):** 10GB storage, 360MB/day transfer
- **Blaze (Pay-as-you-go):** $0.026/GB storage, $0.15/GB transfer

### AWS Amplify
- **Free Tier:** 1000 build minutes, 15GB served/month
- **Paid:** $0.01/build minute, $0.15/GB served

## Support

### Documentation
- [Vercel Docs](https://vercel.com/docs)
- [Netlify Docs](https://docs.netlify.com/)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)
- [AWS Amplify](https://docs.amplify.aws/)

### Community
- GitHub Issues
- Discord/Slack channels
- Stack Overflow

## Conclusion

Choose the deployment platform that best fits your needs:
- **Vercel:** Best for React apps, easiest setup
- **Netlify:** Great features, good free tier
- **Firebase Hosting:** Integrated with Firebase services
- **AWS Amplify:** Best for AWS ecosystem

All platforms provide:
- Automatic HTTPS
- CDN distribution
- Easy rollbacks
- Environment variables
- Custom domains

Follow this guide for a smooth production deployment! 🚀
