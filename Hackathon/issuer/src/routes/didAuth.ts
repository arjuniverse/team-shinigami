/**
 * DID-Auth Challenge-Response Routes
 * Implements authentication flow using did:pkh and MetaMask signatures
 */

import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { ethers } from 'ethers';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// In-memory challenge storage (TTL: 5 minutes)
// For production, use Redis or similar
interface Challenge {
  challenge: string;
  did: string;
  createdAt: number;
  expiresAt: number;
}

const challenges = new Map<string, Challenge>();
const CHALLENGE_TTL = 5 * 60 * 1000; // 5 minutes

// Session token configuration
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-in-production';
const SESSION_TTL = 10 * 60; // 10 minutes in seconds

/**
 * Clean up expired challenges (runs periodically)
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, challenge] of challenges.entries()) {
    if (challenge.expiresAt < now) {
      challenges.delete(key);
    }
  }
}, 60 * 1000); // Clean every minute

/**
 * GET /issuer/challenge
 * Generate a challenge for DID-Auth
 * 
 * Query params:
 *   - did: DID string (did:pkh:eip155:...)
 * 
 * Returns:
 *   - challenge: Random nonce string
 */
router.get(
  '/challenge',
  [
    query('did')
      .isString()
      .matches(/^did:pkh:eip155:\d+:0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid did:pkh format')
  ],
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid DID format',
        details: errors.array()
      });
    }

    try {
      const { did } = req.query as { did: string };

      // Generate cryptographically random challenge
      // Format: UUID + timestamp for uniqueness
      const challenge = `${uuidv4()}-${Date.now()}`;

      // Store challenge with TTL
      const now = Date.now();
      challenges.set(did, {
        challenge,
        did,
        createdAt: now,
        expiresAt: now + CHALLENGE_TTL
      });

      console.log(`📝 Challenge generated for DID: ${did}`);

      res.json({
        success: true,
        challenge,
        expiresIn: CHALLENGE_TTL / 1000 // seconds
      });
    } catch (error: any) {
      console.error('Challenge generation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate challenge'
      });
    }
  }
);

/**
 * POST /issuer/verify-challenge
 * Verify DID-Auth signature and issue session token
 * 
 * Body:
 *   - did: DID string
 *   - challenge: Challenge string from /challenge
 *   - signature: Signature from MetaMask (0x...)
 * 
 * Returns:
 *   - sessionToken: JWT token for VC issuance
 */
router.post(
  '/verify-challenge',
  [
    body('did')
      .isString()
      .matches(/^did:pkh:eip155:\d+:0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid did:pkh format'),
    body('challenge').isString().notEmpty().withMessage('Challenge required'),
    body('signature')
      .isString()
      .matches(/^0x[a-fA-F0-9]{130}$/)
      .withMessage('Invalid signature format')
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
      const { did, challenge, signature } = req.body;

      // 1. Check if challenge exists and is valid
      const storedChallenge = challenges.get(did);
      if (!storedChallenge) {
        return res.status(401).json({
          success: false,
          error: 'Challenge not found or expired. Request a new challenge.'
        });
      }

      // 2. Verify challenge matches
      if (storedChallenge.challenge !== challenge) {
        return res.status(401).json({
          success: false,
          error: 'Invalid challenge'
        });
      }

      // 3. Check challenge not expired
      if (storedChallenge.expiresAt < Date.now()) {
        challenges.delete(did);
        return res.status(401).json({
          success: false,
          error: 'Challenge expired. Request a new challenge.'
        });
      }

      // 4. Extract address from DID
      // Format: did:pkh:eip155:<chainId>:<address>
      const didParts = did.split(':');
      const expectedAddress = didParts[4].toLowerCase();

      // 5. Verify signature using ethers.js
      // Recover signer address from signature
      const recoveredAddress = ethers.verifyMessage(challenge, signature).toLowerCase();

      // 6. Compare addresses
      if (recoveredAddress !== expectedAddress) {
        return res.status(401).json({
          success: false,
          error: 'Signature verification failed. Address mismatch.'
        });
      }

      // 7. Delete used challenge (single-use)
      challenges.delete(did);

      // 8. Generate session token (JWT)
      // This token allows VC issuance for this DID
      const sessionToken = jwt.sign(
        {
          sub: did,
          type: 'did-auth-session',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + SESSION_TTL
        },
        SESSION_SECRET,
        { algorithm: 'HS256' }
      );

      console.log(`✅ DID-Auth successful for: ${did}`);

      res.json({
        success: true,
        sessionToken,
        expiresIn: SESSION_TTL,
        message: 'Authentication successful'
      });
    } catch (error: any) {
      console.error('Verification error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Verification failed'
      });
    }
  }
);

/**
 * Middleware to verify session token
 * Use this to protect VC issuance endpoints
 */
export function verifySessionToken(req: Request, res: Response, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No session token provided. Complete DID-Auth first.'
      });
    }

    const token = authHeader.substring(7);

    // Verify JWT
    const decoded = jwt.verify(token, SESSION_SECRET) as any;

    // Check token type
    if (decoded.type !== 'did-auth-session') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token type'
      });
    }

    // Attach DID to request for use in handlers
    (req as any).authenticatedDid = decoded.sub;

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Session expired. Please authenticate again.'
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid session token'
    });
  }
}

export default router;
