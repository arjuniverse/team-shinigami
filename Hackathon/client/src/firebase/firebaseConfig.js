import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firestore (optional - for storing VC metadata, NOT private keys)
export const db = getFirestore(app);

// Initialize Analytics (optional - only in production)
export const analytics = import.meta.env.PROD ? getAnalytics(app) : null;

// Connect to emulators in development (optional)
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
}

// TODO: PRODUCTION SECURITY NOTES
// 1. Firebase Auth handles user authentication - this is secure
// 2. NEVER store private DID keys or vault encryption keys in Firebase/Firestore
// 3. Only store non-sensitive metadata (VC IDs, timestamps, public info)
// 4. All encryption/decryption must happen client-side
// 5. Private keys must remain in browser localStorage or secure enclave
// 6. Consider using Firebase Security Rules to protect user data
// 7. Enable Firebase App Check to prevent abuse

export default app;
