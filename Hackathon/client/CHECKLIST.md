# DID Vault Client - Setup & Testing Checklist

Complete checklist for setting up and testing the DID Vault client.

## Initial Setup

### Prerequisites
- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm 9+ installed (`npm --version`)
- [ ] Git installed
- [ ] Modern browser (Chrome, Firefox, Safari, Edge)
- [ ] Google account (for Firebase and Google sign-in)

### Installation
- [ ] Repository cloned
- [ ] Navigate to client folder: `cd client`
- [ ] Dependencies installed: `npm install`
- [ ] No installation errors

### Firebase Setup
- [ ] Firebase Console accessed
- [ ] New project created (or existing selected)
- [ ] Web app registered in Firebase
- [ ] Firebase config copied
- [ ] Email/Password authentication enabled
- [ ] Google sign-in enabled
- [ ] Support email selected for Google auth
- [ ] `localhost` in authorized domains

### Environment Configuration
- [ ] `.env.example` copied to `.env`
- [ ] `VITE_ISSUER_API_URL` set to `http://localhost:8080`
- [ ] `VITE_FIREBASE_API_KEY` added
- [ ] `VITE_FIREBASE_AUTH_DOMAIN` added
- [ ] `VITE_FIREBASE_PROJECT_ID` added
- [ ] `VITE_FIREBASE_STORAGE_BUCKET` added
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID` added
- [ ] `VITE_FIREBASE_APP_ID` added
- [ ] No extra spaces or quotes in `.env`

### Backend Setup
- [ ] Issuer backend installed (`cd ../issuer && npm install`)
- [ ] Issuer `.env` configured
- [ ] Hardhat node running (`cd ../blockchain && npx hardhat node`)
- [ ] Anchor contract deployed
- [ ] Issuer service started (`cd ../issuer && npm start`)
- [ ] Issuer running on port 8080

### Client Startup
- [ ] Development server started: `npm run dev`
- [ ] No startup errors in terminal
- [ ] App accessible at `http://localhost:5173`
- [ ] No console errors in browser

## Feature Testing

### Authentication Flow

#### Sign Up (Email/Password)
- [ ] Navigate to `/signup`
- [ ] Enter display name (optional)
- [ ] Enter valid email address
- [ ] Enter password (6+ characters)
- [ ] Confirm password matches
- [ ] Click "Create Account"
- [ ] Success toast appears
- [ ] Redirected to `/vault`
- [ ] DID automatically generated
- [ ] User avatar/initials shown in navbar

#### Login (Email/Password)
- [ ] Logout from current session
- [ ] Navigate to `/login`
- [ ] Enter email
- [ ] Enter password
- [ ] Click "Sign In"
- [ ] Success toast appears
- [ ] Redirected to `/vault`
- [ ] User session persists on refresh

#### Google Sign-In
- [ ] Click "Sign in with Google" button
- [ ] Google OAuth popup appears
- [ ] Select Google account
- [ ] Grant permissions
- [ ] Success toast appears
- [ ] Redirected to `/vault`
- [ ] DID generated if first time
- [ ] User info displayed correctly

#### MetaMask Sign-In (Stub)
- [ ] Click "Sign in with MetaMask" button
- [ ] Error toast shows "not yet implemented"
- [ ] No crashes or errors

### Navigation & UI

#### Navbar
- [ ] Logo visible and clickable
- [ ] All navigation links visible (Home, Upload, Vault, Retrieve, Verify)
- [ ] Active route highlighted
- [ ] Theme toggle button works
- [ ] User menu appears when logged in
- [ ] Profile link in user menu
- [ ] Logout button in user menu
- [ ] Mobile menu button visible on small screens
- [ ] Mobile menu opens and closes correctly

#### Theme Toggle
- [ ] Click moon icon (light mode)
- [ ] Page switches to dark mode
- [ ] Click sun icon (dark mode)
- [ ] Page switches to light mode
- [ ] Theme persists on page refresh
- [ ] All pages respect theme setting

#### Footer
- [ ] Footer visible on all pages
- [ ] Links functional
- [ ] Copyright year correct
- [ ] Responsive on mobile

### Home Page
- [ ] Hero section displays
- [ ] "Get Started" button works
- [ ] "Verify Credential" button works
- [ ] Feature cards display
- [ ] "How It Works" section visible
- [ ] Security notice visible
- [ ] All links functional
- [ ] Responsive on mobile

### Upload Flow

#### File Selection
- [ ] Navigate to `/upload` (requires login)
- [ ] Drag and drop zone visible
- [ ] Click to browse works
- [ ] File selection works
- [ ] File preview shows name, size, type
- [ ] Remove file button works
- [ ] File size validation works (10MB limit)

#### Encryption & Upload
- [ ] Enter passphrase
- [ ] Select document type
- [ ] Click "Encrypt & Upload"
- [ ] Loading indicator appears
- [ ] Success message shows
- [ ] Storage key displayed
- [ ] "Request Credential" button appears

#### Credential Request
- [ ] Click "Request Credential"
- [ ] Loading indicator appears
- [ ] Success message shows
- [ ] Credential issued message displays
- [ ] "View in Vault" button appears
- [ ] Click redirects to vault

### Vault Management

#### Unlock Vault
- [ ] Navigate to `/vault`
- [ ] Passphrase modal appears
- [ ] Enter correct passphrase
- [ ] Click "Unlock Vault"
- [ ] Credentials load and display
- [ ] Success toast shows count

#### View Credentials
- [ ] Credentials displayed as cards
- [ ] Credential type shown
- [ ] Issuer DID shown (truncated)
- [ ] Issuance date shown
- [ ] Storage date shown
- [ ] "View" button works
- [ ] Modal shows full JSON
- [ ] JSON is properly formatted

#### Create Presentation
- [ ] Select one or more credentials (checkboxes)
- [ ] "Create Presentation" button appears
- [ ] Click button
- [ ] Presentation created
- [ ] QR code generated
- [ ] JSON displayed in modal
- [ ] "Copy JSON" button works
- [ ] Copied to clipboard toast shows

#### Empty Vault
- [ ] Clear localStorage
- [ ] Refresh vault page
- [ ] "No credentials" message shows
- [ ] "Upload Document" button visible
- [ ] Button redirects to upload page

### Retrieve Flow
- [ ] Navigate to `/retrieve`
- [ ] CID input field visible
- [ ] Enter storage key
- [ ] Click "Retrieve File"
- [ ] Loading indicator appears
- [ ] File retrieved (or error if not found)
- [ ] Download button appears
- [ ] Download works

### Verify Flow

#### Paste VP JSON
- [ ] Navigate to `/verify`
- [ ] Textarea visible
- [ ] Paste valid VP JSON
- [ ] Click "Verify Presentation"
- [ ] Loading indicator appears
- [ ] Verification result displays
- [ ] Green checkmark for valid
- [ ] Red X for invalid
- [ ] Holder DID shown
- [ ] Credential count shown

#### Upload VP File
- [ ] Click "Upload JSON File"
- [ ] Select .json file
- [ ] File content loads into textarea
- [ ] Verify button enabled
- [ ] Verification works

### Profile Page
- [ ] Navigate to `/profile`
- [ ] User info displayed
- [ ] Email shown
- [ ] Display name shown (if set)
- [ ] DID displayed
- [ ] "Copy DID" button works
- [ ] Export vault button shows (stub)
- [ ] Import vault button shows (stub)
- [ ] Security notice visible
- [ ] Logout button works

### Error Handling

#### Wrong Passphrase
- [ ] Enter wrong passphrase in vault
- [ ] Error toast shows
- [ ] Vault remains locked
- [ ] Can retry with correct passphrase

#### Network Errors
- [ ] Stop issuer backend
- [ ] Try to upload file
- [ ] Error toast shows
- [ ] User-friendly error message

#### Invalid VP
- [ ] Paste invalid JSON in verify
- [ ] Click verify
- [ ] Error toast shows
- [ ] Verification fails gracefully

#### Protected Routes
- [ ] Logout
- [ ] Try to access `/vault` directly
- [ ] Redirected to `/login`
- [ ] Same for `/upload`, `/retrieve`, `/profile`

### Responsive Design

#### Desktop (1920x1080)
- [ ] Layout looks good
- [ ] No horizontal scroll
- [ ] All elements visible
- [ ] Proper spacing

#### Tablet (768x1024)
- [ ] Layout adapts
- [ ] Navigation works
- [ ] Cards stack properly
- [ ] Forms usable

#### Mobile (375x667)
- [ ] Mobile menu works
- [ ] All features accessible
- [ ] Text readable
- [ ] Buttons tappable
- [ ] Forms usable
- [ ] No horizontal scroll

### Accessibility

#### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Focus indicators visible
- [ ] Enter/Space activate buttons
- [ ] Escape closes modals
- [ ] No keyboard traps

#### Screen Reader
- [ ] All images have alt text
- [ ] Buttons have aria-labels
- [ ] Form inputs have labels
- [ ] Error messages announced
- [ ] Loading states announced

#### Color Contrast
- [ ] Text readable in light mode
- [ ] Text readable in dark mode
- [ ] Links distinguishable
- [ ] Buttons have sufficient contrast

### Performance

#### Load Times
- [ ] Initial page load < 3 seconds
- [ ] Route transitions smooth
- [ ] No layout shifts
- [ ] Images load quickly

#### Interactions
- [ ] Button clicks responsive
- [ ] Form submissions fast
- [ ] No UI freezing
- [ ] Smooth animations

### Browser Compatibility

#### Chrome
- [ ] All features work
- [ ] No console errors
- [ ] Styling correct

#### Firefox
- [ ] All features work
- [ ] No console errors
- [ ] Styling correct

#### Safari
- [ ] All features work
- [ ] No console errors
- [ ] Styling correct

#### Edge
- [ ] All features work
- [ ] No console errors
- [ ] Styling correct

## Production Readiness

### Build & Deploy
- [ ] Production build succeeds: `npm run build`
- [ ] No build errors
- [ ] Bundle size reasonable (<1MB)
- [ ] Preview build works: `npm run preview`

### Security
- [ ] No API keys in client code
- [ ] Environment variables used correctly
- [ ] HTTPS required for production
- [ ] Firebase security rules configured
- [ ] CORS configured on backend

### Documentation
- [ ] README.md complete
- [ ] QUICKSTART.md available
- [ ] FIREBASE_SETUP.md available
- [ ] DEPLOYMENT.md available
- [ ] Code comments present

### Monitoring
- [ ] Error tracking configured (optional)
- [ ] Analytics configured (optional)
- [ ] Performance monitoring (optional)

## Known Issues & Limitations

### Current Limitations
- [ ] MetaMask integration not implemented (stub only)
- [ ] Vault export/import not implemented (stub only)
- [ ] No passphrase strength validation
- [ ] localStorage not encrypted at rest
- [ ] did:key is ephemeral (not blockchain-anchored)
- [ ] No key recovery mechanism
- [ ] No credential expiration handling
- [ ] File decryption in retrieve not implemented

### Production TODOs
- [ ] Implement hardware key storage
- [ ] Add passphrase strength requirements
- [ ] Migrate to did:ethr or did:ion
- [ ] Add comprehensive testing
- [ ] Set up CI/CD pipeline
- [ ] Implement vault backup/restore
- [ ] Add credential expiration
- [ ] Implement key rotation

## Sign-Off

### Developer
- [ ] All features tested
- [ ] No critical bugs
- [ ] Code reviewed
- [ ] Documentation complete
- [ ] Ready for demo

### QA
- [ ] Test plan executed
- [ ] All tests passed
- [ ] Edge cases tested
- [ ] Performance acceptable
- [ ] Ready for staging

### Product Owner
- [ ] Requirements met
- [ ] User experience acceptable
- [ ] Documentation reviewed
- [ ] Ready for production

---

**Date:** _______________

**Tested By:** _______________

**Notes:**
_______________________________________________
_______________________________________________
_______________________________________________
