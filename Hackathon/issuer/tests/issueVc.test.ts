/**
 * Verifiable Credential Issuance Tests
 * Tests JWT-VC creation and verification
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/index.js';

describe('VC Issuance', () => {
  let sessionToken: string;
  let testDid: string;
  let issuedJwtVc: string;
  let jti: string;

  beforeAll(() => {
    // Get session token from DID-Auth tests
    sessionToken = (global as any).testSessionToken;
    testDid = (global as any).testDid;
    
    if (!sessionToken || !testDid) {
      throw new Error('Session token or test DID not available. Run DID-Auth tests first.');
    }
  });

  describe('POST /issuer/issue-vc', () => {
    it('should issue JWT-VC with valid session token', async () => {
      const credentialSubject = {
        name: 'Test Document',
        documentCid: 'QmTestCid123',
        documentSha256: 'abc123def456789012345678901234567890123456789012345678901234abcd',
        issuedAt: new Date().toISOString()
      };

      const response = await request(app)
        .post('/issuer/issue-vc')
        .set('Authorization', `Bearer ${sessionToken}`)
        .send({
          subjectDid: testDid,
          credentialSubject: credentialSubject,
          validityDays: 30
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.jwtVc).toBeDefined();
      expect(response.body.jti).toBeDefined();
      expect(response.body.expiresAt).toBeDefined();

      // Store for verification tests
      issuedJwtVc = response.body.jwtVc;
      jti = response.body.jti;

      // Verify JWT structure
      const decoded = jwt.decode(issuedJwtVc, { complete: true });
      expect(decoded).toBeDefined();
      expect(decoded!.header.alg).toBe('ES256K');
      
      const payload = decoded!.payload as any;
      expect(payload.iss).toBe(process.env.ISSUER_DID);
      expect(payload.sub).toBe(testDid);
      expect(payload.jti).toBe(jti);
      expect(payload.vc).toBeDefined();
      expect(payload.vc.credentialSubject.id).toBe(testDid);
      expect(payload.vc.credentialSubject.name).toBe('Test Document');
      expect(payload.vc.credentialSubject.documentCid).toBe('QmTestCid123');
    });

    it('should reject request without session token', async () => {
      const response = await request(app)
        .post('/issuer/issue-vc')
        .send({
          subjectDid: testDid,
          credentialSubject: { name: 'Test' }
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('No session token');
    });

    it('should reject invalid session token', async () => {
      const response = await request(app)
        .post('/issuer/issue-vc')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          subjectDid: testDid,
          credentialSubject: { name: 'Test' }
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid session token');
    });

    it('should reject mismatched subject DID', async () => {
      const wrongDid = 'did:pkh:eip155:1:0x0000000000000000000000000000000000000000';
      
      const response = await request(app)
        .post('/issuer/issue-vc')
        .set('Authorization', `Bearer ${sessionToken}`)
        .send({
          subjectDid: wrongDid,
          credentialSubject: { name: 'Test' }
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Session DID does not match');
    });

    it('should validate credentialSubject format', async () => {
      const response = await request(app)
        .post('/issuer/issue-vc')
        .set('Authorization', `Bearer ${sessionToken}`)
        .send({
          subjectDid: testDid,
          credentialSubject: 'invalid-format'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should validate validityDays range', async () => {
      const response = await request(app)
        .post('/issuer/issue-vc')
        .set('Authorization', `Bearer ${sessionToken}`)
        .send({
          subjectDid: testDid,
          credentialSubject: { name: 'Test' },
          validityDays: 5000 // Too high
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /issuer/verify-vc', () => {
    it('should verify valid JWT-VC', async () => {
      const response = await request(app)
        .get('/issuer/verify-vc')
        .query({ jwt: issuedJwtVc })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.valid).toBe(true);
      expect(response.body.expired).toBe(false);
      expect(response.body.payload).toBeDefined();
      
      const payload = response.body.payload;
      expect(payload.iss).toBe(process.env.ISSUER_DID);
      expect(payload.sub).toBe(testDid);
      expect(payload.jti).toBe(jti);
    });

    it('should reject invalid JWT format', async () => {
      const response = await request(app)
        .get('/issuer/verify-vc')
        .query({ jwt: 'invalid.jwt.format' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.valid).toBe(false);
    });

    it('should require JWT parameter', async () => {
      const response = await request(app)
        .get('/issuer/verify-vc')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('VC Payload Validation', () => {
    it('should include all required VC fields', async () => {
      const decoded = jwt.decode(issuedJwtVc, { complete: true });
      const payload = decoded!.payload as any;

      // JWT claims
      expect(payload.iss).toBeDefined();
      expect(payload.sub).toBeDefined();
      expect(payload.iat).toBeDefined();
      expect(payload.exp).toBeDefined();
      expect(payload.jti).toBeDefined();

      // VC structure
      expect(payload.vc).toBeDefined();
      expect(payload.vc['@context']).toContain('https://www.w3.org/2018/credentials/v1');
      expect(payload.vc.type).toContain('VerifiableCredential');
      expect(payload.vc.issuer).toBe(process.env.ISSUER_DID);
      expect(payload.vc.credentialSubject).toBeDefined();
      expect(payload.vc.credentialSubject.id).toBe(testDid);
    });
  });
});
