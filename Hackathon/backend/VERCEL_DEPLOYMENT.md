# 🚀 Deploy Backend to Vercel

## 📋 Prerequisites
- Vercel account (free)
- GitHub repository with your code

## 🔧 Deployment Steps

### Step 1: Push Changes to GitHub
```bash
git add .
git commit -m "Configure backend for Vercel deployment"
git push
```

### Step 2: Import Project to Vercel

1. **Go to** https://vercel.com/dashboard
2. **Click** "Add New..." → "Project"
3. **Import** your GitHub repository
4. **Configure project:**
   - Framework Preset: **Other**
   - Root Directory: **backend**
   - Build Command: Leave empty or `npm install`
   - Output Directory: Leave empty
   - Install Command: `npm install`

### Step 3: Add Environment Variables

In Vercel project settings → Environment Variables, add:

#### Required Variables:
```bash
NODE_ENV=production
PORT=3001
STORAGE_MODE=json
CORS_ORIGIN=https://your-frontend.vercel.app
```

#### Optional (for Firestore):
```bash
STORAGE_MODE=firestore
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key
```

### Step 4: Deploy
1. **Click** "Deploy"
2. **Wait** 2-3 minutes
3. **Get your URL**: `https://your-backend.vercel.app`

## 🧪 Test Your Deployment

### Health Check:
```bash
curl https://your-backend.vercel.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-12-14T..."
}
```

### Test Metadata Endpoint:
```bash
curl https://your-backend.vercel.app/api/metadata/test-cid
```

## 📝 Update Frontend

After backend is deployed, update your frontend environment variables:

**In Vercel (frontend project):**
```bash
VITE_BACKEND_URL=https://your-backend.vercel.app
```

Then redeploy your frontend.

## ⚠️ Important Notes

### Vercel Serverless Limitations:
- ✅ **10 second timeout** on Hobby plan (enough for most APIs)
- ✅ **50MB deployment size** (your backend is small)
- ⚠️ **No persistent filesystem** (use Firestore or external storage)
- ⚠️ **Cold starts** (first request may be slower)

### Storage Considerations:
- **JSON mode**: Won't persist between deployments (use Firestore instead)
- **Firestore mode**: ✅ Recommended for production
- **Alternative**: Use Vercel KV or external database

## 🔄 Continuous Deployment

Once set up, every push to your main branch will automatically deploy!

## 🐛 Troubleshooting

### Error: "Cannot find module"
- Check that all imports use `.js` extensions
- Verify `"type": "module"` in package.json

### Error: "Function timeout"
- Upgrade to Pro plan for 60s timeout
- Or optimize your functions

### Error: "CORS issues"
- Update `CORS_ORIGIN` environment variable
- Add your frontend URL

### Cold Start Issues
- First request after inactivity may be slow (2-3 seconds)
- Subsequent requests are fast
- Consider using Vercel Edge Functions for faster cold starts

## 📊 Monitoring

View logs in Vercel dashboard:
1. Go to your project
2. Click "Deployments"
3. Click on a deployment
4. View "Functions" tab for logs

## ✅ Success Checklist

- [ ] Backend deployed to Vercel
- [ ] Health check returns 200 OK
- [ ] Environment variables configured
- [ ] Frontend updated with backend URL
- [ ] CORS configured correctly
- [ ] API endpoints working
- [ ] Storage mode configured (Firestore recommended)

## 🎯 Next Steps

1. Deploy issuer to Vercel (similar process)
2. Update frontend with both URLs
3. Test full workflow
4. Monitor performance in Vercel dashboard

Your backend is now serverless and globally distributed! 🌍
