# Firebase Setup Guide

Complete guide to setting up Firebase for the DID Vault client.

## Prerequisites

- Google account
- Node.js 18+ installed
- Basic understanding of Firebase

## Step-by-Step Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name: `did-vault-mvp` (or your preferred name)
4. Click **Continue**
5. (Optional) Enable Google Analytics
6. Click **Create project**
7. Wait for project creation to complete
8. Click **Continue**

### 2. Register Web App

1. In the Firebase Console, click the **Web icon** (`</>`) to add a web app
2. Enter app nickname: `DID Vault Client`
3. (Optional) Check "Also set up Firebase Hosting" if you want to deploy
4. Click **Register app**
5. **IMPORTANT**: Copy the Firebase configuration object - you'll need this!

The config looks like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

6. Click **Continue to console**

### 3. Enable Authentication

#### Enable Email/Password Authentication

1. In the left sidebar, click **Authentication**
2. Click **Get started** (if first time)
3. Go to **Sign-in method** tab
4. Click **Email/Password**
5. Toggle **Enable** switch
6. Click **Save**

#### Enable Google Sign-In

1. Still in **Sign-in method** tab
2. Click **Google**
3. Toggle **Enable** switch
4. Select a **Project support email** from dropdown
5. Click **Save**

### 4. Configure Authorized Domains

1. In **Authentication** section, go to **Settings** tab
2. Scroll to **Authorized domains**
3. By default, `localhost` is already authorized for development
4. For production, add your domain (e.g., `your-app.vercel.app`)

### 5. Set Up Firestore (Optional)

If you want to store non-sensitive metadata:

1. In the left sidebar, click **Firestore Database**
2. Click **Create database**
3. Select **Start in test mode** (for development)
4. Choose a location (closest to your users)
5. Click **Enable**

**IMPORTANT**: Never store private keys or sensitive data in Firestore!

### 6. Configure Security Rules (Optional)

If using Firestore, set up security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Public credential metadata (no private keys!)
    match /credentials/{credentialId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 7. Configure Environment Variables

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Edit `.env` and add your Firebase config:
```env
VITE_ISSUER_API_URL=http://localhost:8080

# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

### 8. Test Authentication

1. Start the dev server:
```bash
npm run dev
```

2. Open `http://localhost:5173`
3. Click **Sign Up**
4. Create an account with email/password
5. Try signing in with Google

## Security Best Practices

### 1. API Key Security

- Firebase API keys are safe to expose in client code
- They identify your Firebase project, not authenticate users
- Use Firebase Security Rules to protect data

### 2. Authentication Security

- Enable email verification in production:
  ```javascript
  // In Firebase Console: Authentication > Templates
  // Customize email verification template
  ```

- Set password requirements:
  ```javascript
  // In Firebase Console: Authentication > Settings
  // Scroll to "Password policy"
  ```

### 3. Firestore Security

- Never store private keys or encryption keys
- Use security rules to restrict access
- Enable App Check for production

### 4. Production Checklist

- [ ] Enable email verification
- [ ] Set strong password requirements
- [ ] Configure Firestore security rules
- [ ] Enable Firebase App Check
- [ ] Add production domain to authorized domains
- [ ] Set up monitoring and alerts
- [ ] Review Firebase usage quotas
- [ ] Enable 2FA for Firebase Console access

## Firebase Emulator (Optional)

For local development without using production Firebase:

### Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Initialize Firebase

```bash
firebase login
firebase init emulators
```

Select:
- Authentication Emulator
- Firestore Emulator (if using)

### Start Emulators

```bash
firebase emulators:start
```

### Configure Client

Add to `.env`:
```env
VITE_USE_FIREBASE_EMULATOR=true
```

The client will automatically connect to local emulators.

## Troubleshooting

### "Firebase: Error (auth/invalid-api-key)"

**Solution**: Check that your API key is correct in `.env` file. No quotes or extra spaces.

### "Firebase: Error (auth/unauthorized-domain)"

**Solution**: Add your domain to authorized domains in Firebase Console > Authentication > Settings > Authorized domains.

### "Firebase: Error (auth/operation-not-allowed)"

**Solution**: Enable the authentication method in Firebase Console > Authentication > Sign-in method.

### Google Sign-In Not Working

**Solution**: 
1. Check that Google sign-in is enabled
2. Verify support email is selected
3. Check browser console for detailed errors
4. Try in incognito mode (extensions can interfere)

### CORS Errors

**Solution**: 
1. Check that domain is authorized in Firebase
2. Ensure you're using HTTPS in production
3. Check browser console for specific CORS error

## Cost Considerations

Firebase has a generous free tier:

### Free Tier Limits (Spark Plan)
- **Authentication**: 10,000 verifications/month
- **Firestore**: 1 GB storage, 50K reads/day, 20K writes/day
- **Hosting**: 10 GB storage, 360 MB/day transfer

### Paid Plan (Blaze - Pay as you go)
- Only pay for what you use beyond free tier
- Authentication: $0.06 per verification (after 50K/month)
- Firestore: $0.18/GB storage, $0.06 per 100K reads

For MVP and small projects, free tier is usually sufficient.

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Authentication Guide](https://firebase.google.com/docs/auth)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Pricing](https://firebase.google.com/pricing)
- [Firebase Console](https://console.firebase.google.com/)

## Support

If you encounter issues:
1. Check Firebase Console for error messages
2. Review browser console for client-side errors
3. Check Firebase status page: https://status.firebase.google.com/
4. Search Firebase documentation and Stack Overflow
