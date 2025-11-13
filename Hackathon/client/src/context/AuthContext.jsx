import { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { generateDidKey, storeDid, retrieveDid } from '../utils/didManager';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userDid, setUserDid] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      // Load user's DID if they're logged in
      if (firebaseUser) {
        const { did } = retrieveDid();
        setUserDid(did);
      } else {
        setUserDid(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Sign up with email and password
  const signup = async (email, password, displayName) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update display name
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }
    
    // Generate DID for new user (client-side only)
    // TODO: SECURITY - Private keys never leave the client
    const { did, privateKey } = await generateDidKey();
    storeDid(did, privateKey);
    setUserDid(did);
    
    return userCredential.user;
  };

  // Sign in with email and password
  const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Load existing DID
    const { did } = retrieveDid();
    setUserDid(did);
    
    return userCredential.user;
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    
    // Check if user has a DID, if not create one
    let { did, privateKey } = retrieveDid();
    if (!did) {
      const didData = await generateDidKey();
      did = didData.did;
      privateKey = didData.privateKey;
      storeDid(did, privateKey);
    }
    setUserDid(did);
    
    return userCredential.user;
  };

  // Sign in with MetaMask (stub for future implementation)
  const signInWithMetaMask = async () => {
    // TODO: Implement MetaMask wallet connection
    // 1. Check if MetaMask is installed
    // 2. Request account access
    // 3. Sign a message to prove ownership
    // 4. Create or retrieve DID associated with wallet address
    // 5. Use wallet address as authentication method
    
    throw new Error('MetaMask sign-in not yet implemented. Coming soon!');
  };

  // Logout
  const logout = async () => {
    await signOut(auth);
    setUserDid(null);
  };

  const value = {
    user,
    userDid,
    loading,
    signup,
    login,
    signInWithGoogle,
    signInWithMetaMask,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
