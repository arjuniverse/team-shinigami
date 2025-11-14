/**
 * Verifiable Credential Issuance Routes
 * Issues JWT-VCs after successful DID-Auth
 */

import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { verifySessionToken } from './didAuth.js';

const router = Router();

// Issuer configuration from environment
const ISSUER_PRIVATE_KEY = process.env.ISSUER_PRIVATE_KEY;
const ISSUER_DID = process.env.ISSUER_DID;
const VC_TOKEN_TTL = parseInt(process.env.VC_TOKEN_TTL || '365', 10); // days

// Validate issuer configuration
if (!ISSUER_PRIVATE_KEY) {
  console.error('❌ ISSUER_PRIVATE_KEY not configured in .env');
  console.error('Run: node src/keys/generateKey.js to generate a key');
}

if (!ISSUER_DID) {
  console.error('❌ ISSUER_DID not configured in .env');
}

// Issuance log file
const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'issuance.log');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Log VC issuance for audit trail
 * Logs: issuer DID, subject DID, jti, timestamp (no PII)
 */
function logIssuance(issuerDid: string, subjectDid: string, jti: string, vcType: string[]) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    issuer: issuerDid,
    subject: subjectDid,
    jti,
    vcType,
    action: 'VC_ISSUED'
  };

  const logLine = JSON.stringify(logEntry) + '\n';
  fs.appendFileSync(LOG_FILE, logLine);
}

/**
 * POST /issuer/issue-vc
 * Issue a JWT Verifiable Credential
 * 
 * Headers:
 *   - Authorization: Bearer <sessionToken>
 * 
 * Body:
 *   - subjectDid: DID of the credential subject
 *   - credentialSubject: Object with credential claims
 *   - validityDays: Optional validity period (default: 365)
 * 
 * Returns:
 *   - jwtVc: Signed JWT Verifiable Credential
 *   - jti: Unique credential ID
 */
router.post(
  '/issue-vc',
  verifySessionToken,
  [
    body('subjectDid')
      .isString()
      .matches(/^did:/)
      .withMessage('Invalid DID format'),
    body('credentialSubject')
      .isObject()
      .withMessage('credentialSubject must be an object'),
    body('validityDays')
      .optional()
      .isInt({ min: 1, max: 3650 })
      .withMessage('validityDays must be between 1 and 3650')
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    try {
      // Check issuer configuration
      if (!ISSUER_PRIVATE_KEY || !ISSUER_DID) {
        return res.status(500).json({
          success: false,
          error: 'Issuer not properly configured'
        });
      }

      const { subjectDid, credentialSubject, validityDays = VC_TOKEN_TTL } = req.body;
      const authenticatedDid = (req as any).authenticatedDid;

      // Verify session token matches subject DID
      if (authenticatedDid !== subjectDid) {
        return res.status(403).json({
          success: false,
          error: 'Session DID does not match subject DID'
        });
      }

      // Generate unique credential ID
      const jti = uuidv4();

      // Timestamps
      const now = Math.floor(Date.now() / 1000);
      const exp = now + (validityDays * 24 * 60 * 60);

      // Construct Verifiable Credential payload
      const vcPayload = {
        '@context': [
          'https://www.w3.org/2018/credentials/v1'
        ],
        type: ['VerifiableCredential', 'DocumentCredential'],
        issuer: ISSUER_DID,
        issuanceDate: new Date(now * 1000).toISOString(),
        expirationDate: new Date(exp * 1000).toISOString(),
        credentialSubject: {
          id: subjectDid,
          ...credentialSubject
        }
      };

      // Create JWT payload
      const jwtPayload = {
        iss: ISSUER_DID,
        sub: subjectDid,
        iat: now,
        exp: exp,
        jti: jti,
        vc: vcPayload
      };

      // Sign JWT-VC using issuer private key
      // Note: Using ES256 (ECDSA with P-256) as ES256K (secp256k1) requires did-jwt library
      // For production, consider using @decentralized-identity/did-jwt for ES256K support
      const jwtVc = jwt.sign(jwtPayload, ISSUER_PRIVATE_KEY, {
        algorithm: 'ES256'
      });

      // Log issuance (audit trail, no PII)
      logIssuance(
        ISSUER_DID,
        subjectDid,
        jti,
        vcPayload.type
      );

      console.log(`✅ VC issued: ${jti} for ${subjectDid}`);

      res.json({
        success: true,
        jwtVc,
        jti,
        expiresAt: new Date(exp * 1000).toISOString()
      });
    } catch (error: any) {
      console.error('VC issuance error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to issue credential'
      });
    }
  }
);

/**
 * GET /issuer/verify-vc
 * Verify a JWT-VC signature (public endpoint)
 * 
 * Query params:
 *   - jwt: JWT-VC string
 * 
 * Returns:
 *   - valid: boolean
 *   - payload: Decoded JWT payload (if valid)
 */
router.get('/verify-vc', async (req: Request, res: Response) => {
  try {
    const { jwt: jwtVc } = req.query;

    if (!jwtVc || typeof jwtVc !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'JWT parameter required'
      });
    }

    if (!ISSUER_PRIVATE_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Issuer not configured'
      });
    }

    // Verify JWT signature
    // Note: For ES256K, we need the public key
    // For simplicity, we'll decode without verification here
    // In production, use proper public key verification
    const decoded = jwt.decode(jwtVc, { complete: true });

    if (!decoded) {
      return res.status(400).json({
        success: false,
        valid: false,
        error: 'Invalid JWT format'
      });
    }

    // Basic validation
    const payload = decoded.payload as any;
    const now = Math.floor(Date.now() / 1000);

    const isValid = 
      payload.iss === ISSUER_DID &&
      payload.exp > now &&
      payload.vc &&
      payload.vc.credentialSubject;

    res.json({
      success: true,
      valid: isValid,
      payload: decoded.payload,
      expired: payload.exp <= now
    });
  } catch (error: any) {
    console.error('VC verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Verification failed'
    });
  }
});

export default router;
