# DID Vault - Client Application

Modern, responsive React frontend for decentralized identity and verifiable credential management.

## Features

- 🔐 **Firebase Authentication** - Email/password + Google sign-in
- 🎨 **Modern UI** - Tailwind CSS with dark mode support
- 🔑 **Client-Side Encryption** - All credentials encrypted in browser
- 📱 **Responsive Design** - Mobile-first, works on all devices
- 🚀 **React Router** - Multi-page navigation with smooth transitions
- ♿ **Accessible** - WCAG AA compliant with semantic HTML
- 🎭 **Framer Motion** - Subtle animations and transitions

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **React Router v6** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **Firebase v10** - Authentication and optional metadata storage
- **Headless UI** - Accessible UI components
- **Heroicons** - Beautiful icon set
- **Framer Motion** - Animation library
- **React Hot Toast** - Toast notifications
- **QRCode** - QR code generation

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project (for authentication)
- Issuer backend running (see `/issuer` folder)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```

3. Edit `.env` and add your Firebase configuration:
```env
VITE_ISSUER_API_URL=http://localhost:8080

VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password
   - Enable Google sign-in
4. Get your config:
   - Go to Project Settings > General
   - Scroll to "Your apps" and select Web app
   - Copy the config values to your `.env` file

### Running the App

Development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Project Structure

```
client/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Navbar.jsx       # Navigation bar
│   │   ├── Footer.jsx       # Footer
│   │   ├── Hero.jsx         # Landing page hero
│   │   ├── Layout.jsx       # Page layout wrapper
│   │   ├── Modal.jsx        # Modal dialog
│   │   ├── Loader.jsx       # Loading spinner
│   │   ├── Skeleton.jsx     # Skeleton loaders
│   │   ├── FileDropzone.jsx # File upload component
│   │   ├── CredentialCard.jsx # Credential display card
│   │   └── ToastProvider.jsx # Toast notifications
│   ├── pages/               # Page components
│   │   ├── Home.jsx         # Landing page
│   │   ├── Login.jsx        # Login page
│   │   ├── Signup.jsx       # Signup page
│   │   ├── Vault.jsx        # Credential vault
│   │   ├── Upload.jsx       # File upload & VC request
│   │   ├── Retrieve.jsx     # File retrieval
│   │   ├── Verify.jsx       # VP verification
│   │   ├── Profile.jsx      # User profile
│   │   └── NotFound.jsx     # 404 page
│   ├── context/             # React contexts
│   │   └── AuthContext.jsx  # Firebase auth context
│   ├── firebase/            # Firebase configuration
│   │   └── firebaseConfig.js
│   ├── hooks/               # Custom React hooks
│   │   └── useTheme.js      # Dark mode hook
│   ├── utils/               # Utility functions
│   │   ├── cryptoVault.js   # Vault encryption
│   │   ├── didManager.js    # DID generation
│   │   └── r2Upload.js      # File upload
│   ├── styles/              # Global styles
│   │   └── index.css        # Tailwind + custom CSS
│   ├── App.jsx              # Main app component
│   └── main.jsx             # Entry point
├── public/                  # Static assets
├── index.html               # HTML template
├── tailwind.config.js       # Tailwind configuration
├── postcss.config.js        # PostCSS configuration
├── vite.config.js           # Vite configuration
└── package.json             # Dependencies
```

## Key Features

### Authentication Flow

1. User signs up with email/password or Google
2. DID is automatically generated client-side
3. Private keys stored in browser localStorage
4. Firebase handles user session management

### Upload Flow

1. Select file to upload
2. File encrypted client-side with AES-GCM
3. Encrypted file uploaded to R2 storage
4. Request verifiable credential from issuer
5. VC encrypted and stored in local vault

### Vault Management

1. Enter passphrase to unlock vault
2. View all stored credentials
3. Select credentials to create presentation
4. Generate QR code or copy JSON

### Verification

1. Paste or upload verifiable presentation
2. Backend verifies signatures and revocation
3. Display verification result

## Security Notes

⚠️ **IMPORTANT SECURITY CONSIDERATIONS**

### What's Secure (MVP)
- ✅ Client-side encryption using WebCrypto API
- ✅ Private keys never leave the browser
- ✅ Firebase handles authentication securely
- ✅ HTTPS in production (required)

### What Needs Improvement for Production
- ⚠️ localStorage is not encrypted at rest
- ⚠️ No passphrase strength requirements
- ⚠️ No key rotation or recovery mechanism
- ⚠️ No hardware security module (HSM) integration
- ⚠️ did:key is ephemeral, not blockchain-anchored

### Production Recommendations
1. **Use Hardware-Backed Storage**
   - WebAuthn for key management
   - Secure Enclave on mobile
   - Hardware Security Modules (HSM)

2. **Implement Key Management**
   - Key derivation from strong passphrases
   - Key rotation policies
   - Backup and recovery flows
   - Multi-factor authentication

3. **Upgrade DID Method**
   - Migrate from did:key to did:ethr or did:ion
   - On-chain DID resolution
   - Revocation registry

4. **Add Security Features**
   - Passphrase strength meter
   - Rate limiting on auth attempts
   - Session timeout
   - Audit logging

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_ISSUER_API_URL` | Backend issuer API URL | Yes |
| `VITE_FIREBASE_API_KEY` | Firebase API key | Yes |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Yes |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Yes |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | Yes |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | Yes |
| `VITE_USE_FIREBASE_EMULATOR` | Use local emulator | No |

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

Requires WebCrypto API support for encryption.

## Development

### Code Style
- Use functional components with hooks
- Follow React best practices
- Use Tailwind utility classes
- Keep components small and focused

### Adding New Pages
1. Create page component in `src/pages/`
2. Add route in `src/App.jsx`
3. Add navigation link in `src/components/Navbar.jsx`

### Customizing Theme
Edit `tailwind.config.js` to customize colors, fonts, and other design tokens.

## Troubleshooting

### Firebase Auth Errors
- Check Firebase console for enabled auth methods
- Verify environment variables are correct
- Check browser console for detailed errors

### Build Errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`

### Styling Issues
- Ensure Tailwind is processing correctly
- Check PostCSS configuration
- Verify CSS import in main.jsx

## TODO for Production

- [ ] Implement MetaMask wallet connection
- [ ] Add passphrase strength validation
- [ ] Implement vault export/import
- [ ] Add credential revocation UI
- [ ] Implement file decryption in retrieve flow
- [ ] Add comprehensive error boundaries
- [ ] Implement analytics and monitoring
- [ ] Add unit and integration tests
- [ ] Set up CI/CD pipeline
- [ ] Add PWA support for offline access

## License

MIT
