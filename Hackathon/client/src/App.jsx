import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ToastProvider from './components/ToastProvider';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Vault from './pages/Vault';
import Upload from './pages/Upload';
import Retrieve from './pages/Retrieve';
import Verify from './pages/Verify';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Secure Document Pages (new)
import SecureUpload from './pages/SecureUpload';
import SecureFiles from './pages/SecureFiles';
import SecureDecrypt from './pages/SecureDecrypt';
import SecureVerify from './pages/SecureVerify';

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route path="verify" element={<Verify />} />
            <Route
              path="vault"
              element={
                <ProtectedRoute>
                  <Vault />
                </ProtectedRoute>
              }
            />
            <Route
              path="upload"
              element={
                <ProtectedRoute>
                  <Upload />
                </ProtectedRoute>
              }
            />
            <Route
              path="retrieve"
              element={
                <ProtectedRoute>
                  <Retrieve />
                </ProtectedRoute>
              }
            />
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            
            {/* Secure Document Routes */}
            <Route
              path="secure-upload"
              element={
                <ProtectedRoute>
                  <SecureUpload />
                </ProtectedRoute>
              }
            />
            <Route
              path="secure-files"
              element={
                <ProtectedRoute>
                  <SecureFiles />
                </ProtectedRoute>
              }
            />
            <Route
              path="secure-decrypt"
              element={
                <ProtectedRoute>
                  <SecureDecrypt />
                </ProtectedRoute>
              }
            />
            <Route
              path="secure-verify"
              element={
                <ProtectedRoute>
                  <SecureVerify />
                </ProtectedRoute>
              }
            />
            
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
