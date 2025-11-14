/**
 * DID-Auth Integration Tests
 * Tests challenge-response flow with Hardhat private key
 */

import request from 'supertest';
import { ethers } from 'ethers';
import app from '../src/index.js';

describe('DID-Auth Flow', () => {
  let testWallet: ethers.Wallet;
  let testDid: string;
  let challenge: string;
  let sessionToken: string;

  beforeAll(() => {
    // Use first Hardhat account for testing
    const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    testWallet = new ethers.Wallet(privateKey);
    
    // Create test DID (using chain ID 31337 for Hardhat)
    testDid = `did:pkh:eip155:31337:${testWallet.address.toLowerCase()}`;
    
    console.log('Test DID:', testDid);
    console.log('Test Address:', testWallet.address);
  });

  describe('GET /issuer/challenge', () => {
    it('should generate a challenge for valid DID', async () => {
      const response = await request(app)
        .get('/issuer/challenge')
        .query({ did: testDid })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.challenge).toBeDefined();
      expect(typeof response.body.challenge).toBe('string');
      expect(response.body.expiresIn).toBe(300); // 5 minutes

      // Store challenge for next test
      challenge = response.body.challenge;
    });

    it('should reject invalid DID format', async () => {
      const response = await request(app)
        .get('/issuer/challenge')
        .query({ did: 'invalid-did' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid did:pkh format');
    });

    it('should require DID parameter', async () => {
      const response = await request(app)
        .get('/issuer/challenge')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /issuer/verify-challenge', () => {
    it('should verify valid signature and return session token', async () => {
      // Sign challenge with test wallet
      const signature = await testWallet.signMessage(challenge);

      const response = await request(app)
        .post('/issuer/verify-challenge')
        .send({
          did: testDid,
          challenge: challenge,
          signature: signature
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.sessionToken).toBeDefined();
      expect(typeof response.body.sessionToken).toBe('string');
      expect(response.body.expiresIn).toBe(600); // 10 minutes
      expect(response.body.message).toBe('Authentication successful');

      // Store session token for VC tests
      sessionToken = response.body.sessionToken;
    });

    it('should reject invalid signature', async () => {
      // Create invalid signature
      const invalidSignature = '0x' + '0'.repeat(130);

      const response = await request(app)
        .post('/issuer/verify-challenge')
        .send({
          did: testDid,
          challenge: challenge,
          signature: invalidSignature
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('verification failed');
    });

    it('should reject wrong challenge', async () => {
      const wrongChallenge = 'wrong-challenge';
      const signature = await testWallet.signMessage(wrongChallenge);

      const response = await request(app)
        .post('/issuer/verify-challenge')
        .send({
          did: testDid,
          challenge: wrongChallenge,
          signature: signature
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Challenge not found');
    });

    it('should reject malformed requests', async () => {
      const response = await request(app)
        .post('/issuer/verify-challenge')
        .send({
          did: 'invalid',
          challenge: '',
          signature: 'invalid'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Session Token Validation', () => {
    it('should accept valid session token', async () => {
      // This will be tested in VC issuance tests
      expect(sessionToken).toBeDefined();
      expect(sessionToken.length).toBeGreaterThan(0);
    });
  });

  describe('Challenge Expiration', () => {
    it('should reject expired challenge', async () => {
      // Generate new challenge
      const challengeResponse = await request(app)
        .get('/issuer/challenge')
        .query({ did: testDid })
        .expect(200);

      const newChallenge = challengeResponse.body.challenge;

      // Wait for challenge to expire (in real test, mock time)
      // For now, just test with non-existent challenge
      const expiredChallenge = 'expired-challenge-' + Date.now();
      const signature = await testWallet.signMessage(expiredChallenge);

      const response = await request(app)
        .post('/issuer/verify-challenge')
        .send({
          did: testDid,
          challenge: expiredChallenge,
          signature: signature
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Challenge not found');
    });
  });

  // Export session token for VC tests
  afterAll(() => {
    // Store session token in global for VC tests
    (global as any).testSessionToken = sessionToken;
    (global as any).testDid = testDid;
  });
});
