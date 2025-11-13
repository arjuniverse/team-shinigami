# Quick Start Guide - DID Vault Client

Get up and running with the DID Vault client in 5 minutes!

## Step 1: Install Dependencies

```bash
cd client
npm install
```

## Step 2: Set Up Firebase

### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select existing project
3. Follow the setup wizard

### Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click **Get Started**
3. Go to **Sign-in method** tab
4. Enable **Email/Password**:
   - Toggle the switch to enable
   - Click Save
5. Enable **Google**:
   - Toggle the switch to enable
   - Select a support email
   - Click Save

### Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll to **Your apps** section
3. Click the **Web** icon (`</>`)
4. Register your app (name: "DID Vault Client")
5. Copy the config object

## Step 3: Configure Environment

1. Copy the example env file:
```bash
cp .env.example .env
```

2. Edit `.env` and paste your Firebase config:
```env
VITE_ISSUER_API_URL=http://localhost:8080

VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

## Step 4: Start the Issuer Backend

The client needs the issuer backend running. In a separate terminal:

```bash
cd ../issuer
npm install
npm start
```

The issuer should be running on `http://localhost:8080`

## Step 5: Start the Client

```bash
npm run dev
```

The app will open at `http://localhost:5173`

## Step 6: Try It Out!

### Create an Account

1. Click **Get Started** or **Sign Up**
2. Enter your email and password
3. Click **Create Account**
4. Your DID will be automatically generated!

### Upload a Document

1. Go to **Upload** page
2. Drag and drop a file or click to browse
3. Enter a passphrase (remember this!)
4. Select document type
5. Click **Encrypt & Upload**
6. Click **Request Credential**

### View Your Vault

1. Go to **Vault** page
2. Enter your passphrase
3. See your stored credentials
4. Select credentials and create a presentation

### Verify a Presentation

1. Go to **Verify** page
2. Paste the presentation JSON
3. Click **Verify Presentation**
4. See the verification result

## Common Issues

### "Firebase: Error (auth/invalid-api-key)"
- Check that your Firebase API key is correct in `.env`
- Make sure there are no extra spaces or quotes

### "Network error during upload"
- Ensure the issuer backend is running on port 8080
- Check `VITE_ISSUER_API_URL` in `.env`

### "Failed to unlock vault"
- Make sure you're using the same passphrase you used when uploading
- Passphrase is case-sensitive

### Build errors
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`

## Next Steps

- Customize the theme in `tailwind.config.js`
- Add more credential types in `Upload.jsx`
- Implement MetaMask wallet connection
- Deploy to production (Vercel, Netlify, etc.)

## Development Tips

### Hot Reload
Vite provides instant hot module replacement. Just save your files and see changes immediately.

### Dark Mode
Click the moon/sun icon in the navbar to toggle dark mode.

### Responsive Design
Resize your browser or use dev tools to test mobile views.

### Component Development
All components are in `src/components/` and pages in `src/pages/`. They're well-documented with comments.

## Production Deployment

### Build for Production
```bash
npm run build
```

Output will be in `dist/` folder.

### Environment Variables
Make sure to set all environment variables in your hosting platform:
- Vercel: Project Settings > Environment Variables
- Netlify: Site Settings > Build & Deploy > Environment

### Security Checklist
- [ ] Use HTTPS (required for WebCrypto)
- [ ] Set up Firebase security rules
- [ ] Enable Firebase App Check
- [ ] Configure CORS on issuer backend
- [ ] Set up rate limiting
- [ ] Enable Firebase authentication email verification

## Need Help?

- Check the main [README.md](./README.md) for detailed documentation
- Review the [project overview](../project-overview.html)
- Check Firebase Console for auth errors
- Look at browser console for client-side errors
- Check issuer logs for backend errors

Happy building! 🚀
