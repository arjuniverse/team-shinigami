const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
require('dotenv').config();
const { initializeIssuerDid, agent, getIssuerDid } = require('./veramo-agent');

const app = express();
const PORT = process.env.PORT || 8080;

// Configure multer for in-memory file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Configure S3Client for Cloudflare R2
// TODO: Production improvement - Consider using pre-signed URLs for direct client-to-R2 uploads
// This would reduce server load and improve upload performance
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'did-vault-issuer' });
});

// POST /upload - Upload encrypted file to Cloudflare R2
app.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    // Validate file was provided
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Generate unique storage key for the file
    const fileExtension = req.file.originalname.split('.').pop();
    const storageKey = `${crypto.randomUUID()}.${fileExtension}`;
    
    // Prepare upload parameters
    const uploadParams = {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: storageKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      Metadata: {
        originalName: req.file.originalname,
        uploadTimestamp: new Date().toISOString()
      }
    };

    // Upload to R2
    const command = new PutObjectCommand(uploadParams);
    await r2Client.send(command);

    // Return success response with storage key and metadata
    res.status(200).json({
      storageKey,
      bucket: process.env.R2_BUCKET_NAME,
      timestamp: new Date().toISOString(),
      size: req.file.size,
      originalName: req.file.originalname
    });

  } catch (error) {
    console.error('R2 upload error:', error);
    
    // Handle specific R2/S3 errors
    if (error.name === 'NoSuchBucket') {
      return res.status(500).json({ 
        error: 'R2 bucket not found. Please check R2_BUCKET_NAME configuration.' 
      });
    }
    
    if (error.name === 'InvalidAccessKeyId' || error.name === 'SignatureDoesNotMatch') {
      return res.status(500).json({ 
        error: 'R2 authentication failed. Please check R2 credentials.' 
      });
    }
    
    // Generic error response (don't expose internal details)
    res.status(500).json({ 
      error: 'File upload failed',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper function to load revocation registry
function loadRevocationRegistry() {
  try {
    const revokePath = path.join(__dirname, 'revoke.json');
    const data = fs.readFileSync(revokePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading revocation registry:', error);
    // Return empty registry if file doesn't exist or is invalid
    return { revokedCredentials: [], lastUpdated: new Date().toISOString() };
  }
}

// Helper function to check if a credential is revoked
function isCredentialRevoked(credentialId, revocationRegistry) {
  return revocationRegistry.revokedCredentials.includes(credentialId);
}

// POST /issue - Issue a Verifiable Credential
app.post('/issue', async (req, res) => {
  try {
    const { subjectDid, claims } = req.body;

    // Validate request payload structure
    if (!subjectDid) {
      return res.status(400).json({ 
        error: 'Missing required field: subjectDid' 
      });
    }

    if (!claims || typeof claims !== 'object') {
      return res.status(400).json({ 
        error: 'Missing or invalid required field: claims (must be an object)' 
      });
    }

    // Validate DID format (basic validation)
    if (!subjectDid.startsWith('did:')) {
      return res.status(400).json({ 
        error: 'Invalid DID format. DID must start with "did:"' 
      });
    }

    // Get issuer DID
    const issuerDid = getIssuerDid();

    // Create W3C-compliant Verifiable Credential
    const credential = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential', 'DocumentOwnershipCredential'],
      issuer: {
        id: issuerDid
      },
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: subjectDid,
        ...claims
      }
    };

    // Sign the credential with issuer's DID using JWT proof format
    const verifiableCredential = await agent.createVerifiableCredential({
      credential,
      proofFormat: 'jwt'
    });

    // Return signed VC with HTTP 200
    res.status(200).json({
      vc: verifiableCredential
    });

  } catch (error) {
    console.error('Credential issuance error:', error);

    // Handle Veramo-specific errors
    if (error.message && error.message.includes('DID')) {
      return res.status(400).json({ 
        error: 'Invalid DID format or DID resolution failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    if (error.message && error.message.includes('Issuer DID not initialized')) {
      return res.status(500).json({ 
        error: 'Issuer service not properly initialized' 
      });
    }

    // Generic error response
    res.status(500).json({ 
      error: 'Credential issuance failed',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /verify - Verify a Verifiable Presentation
app.post('/verify', async (req, res) => {
  try {
    const { vp } = req.body;

    // Validate VP was provided
    if (!vp) {
      return res.status(400).json({ 
        error: 'Missing required field: vp',
        verified: false,
        reason: 'No verifiable presentation provided'
      });
    }

    // Validate VP structure
    if (!vp.type || !Array.isArray(vp.type) || !vp.type.includes('VerifiablePresentation')) {
      return res.status(400).json({ 
        error: 'Invalid VP format: missing or invalid type field',
        verified: false,
        reason: 'Invalid verifiable presentation format'
      });
    }

    if (!vp.verifiableCredential || !Array.isArray(vp.verifiableCredential)) {
      return res.status(400).json({ 
        error: 'Invalid VP format: missing or invalid verifiableCredential field',
        verified: false,
        reason: 'Invalid verifiable presentation format'
      });
    }

    // Verify VP cryptographic proofs using Veramo agent
    let verificationResult;
    try {
      verificationResult = await agent.verifyPresentation({
        presentation: vp
      });
    } catch (verifyError) {
      console.error('VP verification error:', verifyError);
      return res.status(200).json({
        verified: false,
        reason: 'Invalid signature or cryptographic proof',
        details: process.env.NODE_ENV === 'development' ? verifyError.message : undefined
      });
    }

    // Check if cryptographic verification passed
    if (!verificationResult.verified) {
      return res.status(200).json({
        verified: false,
        reason: 'Invalid signature or cryptographic proof',
        details: verificationResult.error || 'Verification failed'
      });
    }

    // Load revocation registry
    const revocationRegistry = loadRevocationRegistry();

    // Check each VC in the VP against revocation registry
    const credentials = Array.isArray(vp.verifiableCredential) 
      ? vp.verifiableCredential 
      : [vp.verifiableCredential];

    for (const vc of credentials) {
      // Extract credential ID (can be in different formats)
      let credentialId = vc.id;
      
      // If VC is in JWT format, try to extract from the JWT
      if (typeof vc === 'string') {
        try {
          // JWT format - decode to get the ID
          const payload = JSON.parse(Buffer.from(vc.split('.')[1], 'base64').toString());
          credentialId = payload.jti || payload.vc?.id;
        } catch (e) {
          console.error('Error parsing JWT credential:', e);
        }
      } else if (vc.proof && vc.proof.jwt) {
        // VC object with JWT proof
        try {
          const payload = JSON.parse(Buffer.from(vc.proof.jwt.split('.')[1], 'base64').toString());
          credentialId = payload.jti || vc.id;
        } catch (e) {
          console.error('Error parsing JWT proof:', e);
        }
      }

      // Check if credential is revoked
      if (credentialId && isCredentialRevoked(credentialId, revocationRegistry)) {
        return res.status(200).json({
          verified: false,
          reason: 'Credential revoked',
          revokedCredentialId: credentialId
        });
      }

      // Check expiration date if present
      if (vc.expirationDate) {
        const expirationDate = new Date(vc.expirationDate);
        if (expirationDate < new Date()) {
          return res.status(200).json({
            verified: false,
            reason: 'Credential expired',
            expiredCredentialId: credentialId,
            expirationDate: vc.expirationDate
          });
        }
      }
    }

    // All checks passed - VP is valid
    res.status(200).json({
      verified: true,
      reason: 'Valid presentation with all credentials verified',
      credentialCount: credentials.length
    });

  } catch (error) {
    console.error('Verification endpoint error:', error);

    // Generic error response
    res.status(500).json({ 
      error: 'Verification failed',
      verified: false,
      reason: 'Internal server error during verification',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /anchor - Anchor credential hash on blockchain
app.post('/anchor', async (req, res) => {
  try {
    const { dataHash } = req.body;

    // Validate dataHash was provided
    if (!dataHash) {
      return res.status(400).json({ 
        error: 'Missing required field: dataHash' 
      });
    }

    // Validate dataHash format (should be 0x-prefixed hex string)
    if (typeof dataHash !== 'string' || !dataHash.startsWith('0x')) {
      return res.status(400).json({ 
        error: 'Invalid dataHash format. Must be a 0x-prefixed hex string' 
      });
    }

    // Load deployed contract address from JSON file
    const deployedAddressPath = path.join(__dirname, '..', 'blockchain', 'deployed-address.json');
    
    let contractAddress;
    try {
      const deploymentData = fs.readFileSync(deployedAddressPath, 'utf8');
      const deployment = JSON.parse(deploymentData);
      contractAddress = deployment.contractAddress;
      
      if (!contractAddress) {
        throw new Error('Contract address not found in deployment file');
      }
    } catch (error) {
      console.error('Error loading contract address:', error);
      return res.status(500).json({ 
        error: 'Contract address not found. Please deploy the Anchor contract first.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    // Connect to Hardhat network
    const networkUrl = process.env.HARDHAT_NETWORK_URL || 'http://localhost:8545';
    let provider;
    try {
      provider = new ethers.JsonRpcProvider(networkUrl);
      // Test connection
      await provider.getNetwork();
    } catch (error) {
      console.error('Blockchain network connection error:', error);
      return res.status(503).json({ 
        error: 'Blockchain network unavailable. Please ensure Hardhat node is running.',
        networkUrl,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    // Get signer (use first account from Hardhat node)
    const signer = await provider.getSigner(0);

    // Anchor contract ABI (only the anchor function we need)
    const anchorABI = [
      'function anchor(bytes32 hash) public returns (bool)',
      'event Anchored(bytes32 indexed hash, address indexed sender, uint256 timestamp)'
    ];

    // Create contract instance
    const anchorContract = new ethers.Contract(contractAddress, anchorABI, signer);

    // Submit transaction to Anchor contract
    let tx;
    try {
      tx = await anchorContract.anchor(dataHash);
      console.log('Transaction submitted:', tx.hash);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log('Transaction mined in block:', receipt.blockNumber);

      // Return transaction hash and block number on success
      res.status(200).json({
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        contractAddress,
        dataHash,
        timestamp: new Date().toISOString()
      });

    } catch (txError) {
      console.error('Transaction error:', txError);
      
      // Handle specific transaction errors
      if (txError.message && txError.message.includes('already anchored')) {
        return res.status(400).json({ 
          error: 'Hash already anchored',
          dataHash
        });
      }

      return res.status(500).json({ 
        error: 'Transaction failed',
        details: process.env.NODE_ENV === 'development' ? txError.message : undefined
      });
    }

  } catch (error) {
    console.error('Anchor endpoint error:', error);

    // Generic error response
    res.status(500).json({ 
      error: 'Anchoring failed',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server and initialize Veramo agent
async function startServer() {
  try {
    // Initialize issuer DID before starting server
    await initializeIssuerDid();
    
    app.listen(PORT, () => {
      console.log(`Issuer service running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
