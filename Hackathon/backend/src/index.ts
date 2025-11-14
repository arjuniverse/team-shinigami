/**
 * Express backend server for secure document workflow
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import metadataRoutes from './routes/metadata.js';
import uploadRoutes from './routes/upload.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Initialize Firestore if needed
if (process.env.STORAGE_MODE === 'firestore') {
  try {
    const admin = await import('firebase-admin');
    const { initializeFirestore } = await import('./storage/index.js');
    
    let serviceAccount;
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const fs = await import('fs/promises');
      const accountData = await fs.readFile(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf-8');
      serviceAccount = JSON.parse(accountData);
    } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
      serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      };
    }

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as any),
      });
      initializeFirestore(admin.firestore());
      console.log('✅ Firebase Admin initialized');
    } else {
      console.error('❌ Firestore mode selected but credentials not provided');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Failed to initialize Firestore:', error);
    process.exit(1);
  }
}

// Routes
app.use('/api/metadata', metadataRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// For Vercel serverless deployment
export default app;

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`📝 Storage mode: ${process.env.STORAGE_MODE || 'json'}`);
  });
}
