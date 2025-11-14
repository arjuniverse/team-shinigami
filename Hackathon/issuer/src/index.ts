/**
 * Issuer Server - TypeScript Version
 * Provides DID-Auth and JWT-VC issuance services
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Import routes
import didAuthRoutes from './routes/didAuth.js';
import vcRoutes from './routes/vc.js';

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'issuer',
    version: '1.0.0'
  });
});

// API Routes
app.use('/issuer', didAuthRoutes);
app.use('/issuer', vcRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'DID-Auth & JWT-VC Issuer Service',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      challenge: '/issuer/challenge?did=<did>',
      verifyChallenge: '/issuer/verify-challenge',
      issueVc: '/issuer/issue-vc',
      verifyVc: '/issuer/verify-vc?jwt=<jwt>'
    },
    documentation: 'See README.md for API usage'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Configuration validation
function validateConfiguration() {
  const required = ['ISSUER_PRIVATE_KEY', 'ISSUER_DID', 'SESSION_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\n💡 Run: npm run generate-key to generate configuration');
    console.error('   Then: cp .env.generated .env');
    return false;
  }
  
  return true;
}

// Start server
if (validateConfiguration()) {
  app.listen(PORT, () => {
    console.log('🚀 Issuer server started');
    console.log(`📡 Listening on http://localhost:${PORT}`);
    console.log(`🔑 Issuer DID: ${process.env.ISSUER_DID}`);
    console.log(`📝 Logs directory: ${logsDir}`);
    console.log('\n🔗 Available endpoints:');
    console.log(`   GET  /health`);
    console.log(`   GET  /issuer/challenge?did=<did>`);
    console.log(`   POST /issuer/verify-challenge`);
    console.log(`   POST /issuer/issue-vc`);
    console.log(`   GET  /issuer/verify-vc?jwt=<jwt>`);
    console.log('\n✅ Ready for DID-Auth requests');
  });
} else {
  console.error('❌ Server startup failed due to configuration errors');
  process.exit(1);
}

export default app;
