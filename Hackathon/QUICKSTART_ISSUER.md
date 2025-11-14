# Issuer Service Quickstart Guide

Complete guide to setting up and using the DID-Auth & JWT-VC Issuer Service.

## Table of Contents

1. [Setup](#setup)
2. [Generate Keys](#generate-keys)
3. [Start Server](#start-server)
4. [DID-Auth Flow](#did-auth-flow)
5. [Issue Credentials](#issue-credentials)
6. [Example cURL Commands](#example-curl-commands)
7. [Client Integration](#client-integration)

## Setup

### Prerequisites

- Node.js >= 18.0.0
- npm or pnpm
- MetaMask browser extension (for client)

### Install Dependencies

```bash
cd issuer
npm install
```

## Generate Keys

The issuer needs a private key to sign JWT-VCs. Generate one using:

```bash
npm run generate-key
```

This will:
1. Generate a new ECDSA secp256k1 keypair
2. Create an issuer DID (did:pkh:eip155:1:0x...)
3. Generate a random session secret
4. Save configuration to `.env.generated`

Example output:
```
🔑 Generating Issuer Keypair for JWT-VC Signing

📋 Generated Keypair:
Private Key: 0x1234567890abcdef...
Public Key: 0x04abcdef...
Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
Issuer DID: did:pkh:eip155:1:0x742d35cc6634c0532925a3b844bc9e7595f0beb

📝 .env Configuration:
────────────────────────────────────────────────────────────
# Issuer Configuration (Generated: 2024-01-15T10:30:00.000Z)
# Keep ISSUER_PRIVATE_KEY secret - never commit to git!

ISSUER_PRIVATE_KEY=0x1234567890abcdef...
ISSUER_DID=did:pkh:eip155:1:0x742d35cc6634c0532925a3b844bc9e7595f0beb
SESSION_SECRET=0xabcdef...
VC_TOKEN_TTL=365
PORT=8080
NODE_ENV=development
────────────────────────────────────────────────────────────

✅ Configuration saved to: .env.generated

⚠️  SECURITY WARNINGS:
1. Keep ISSUER_PRIVATE_KEY secret - never commit to git!
2. Copy .env.generated to .env and customize as needed
3. Change SESSION_SECRET in production
4. Use hardware security modules (HSM) for production keys
5. Backup your private key securely

🚀 Next Steps:
1. cp .env.generated .env
2. Review and customize .env file
3. npm run dev
4. Test DID-Auth flow with client
```

### Configure Environment

```bash
# Copy generated config
cp .env.generated .env

# Edit if needed
nano .env
```

Required variables:
- `ISSUER_PRIVATE_KEY` - Private key for signing JWTs (ES256K)
- `ISSUER_DID` - Issuer's DID (did:pkh:eip155:...)
- `SESSION_SECRET` - Secret for session token signing
- `VC_TOKEN_TTL` - Credential validity in days (default: 365)
- `PORT` - Server port (default: 8080)

## Start Server

### Development Mode

```bash
npm run dev
```

Output:
```
🚀 Issuer server started
📡 Listening on http://localhost:8080
🔑 Issuer DID: did:pkh:eip155:1:0x742d35cc6634c0532925a3b844bc9e7595f0beb
📝 Logs directory: /path/to/issuer/logs

🔗 Available endpoints:
   GET  /health
   GET  /issuer/challenge?did=<did>
   POST /issuer/verify-challenge
   POST /issuer/issue-vc
   GET  /issuer/verify-vc?jwt=<jwt>

✅ Ready for DID-Auth requests
```

### Production Mode

```bash
npm run build
npm start
```

## DID-Auth Flow

The DID-Auth flow authenticates users using their DID and MetaMask signatures.

### Step 1: Request Challenge

Client requests a challenge for their DID:

```bash
GET /issuer/challenge?did=did:pkh:eip155:31337:0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
```

Response:
```json
{
  "success": true,
  "challenge": "abc123-uuid-timestamp",
  "expiresIn": 300
}
```

**Notes**:
- Challenge expires in 5 minutes
- Challenge is single-use
- DID format: `did:pkh:eip155:<chainId>:<address>`

### Step 2: Sign Challenge

Client signs the challenge using MetaMask (EIP-191 personal_sign):

```javascript
// In client
const signature = await window.ethereum.request({
  method: 'personal_sign',
  params: [challenge, address]
});
```

### Step 3: Verify Challenge

Client sends signed challenge to issuer:

```bash
POST /issuer/verify-challenge
Content-Type: application/json

{
  "did": "did:pkh:eip155:31337:0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
  "challenge": "abc123-uuid-timestamp",
  "signature": "0x..."
}
```

Response:
```json
{
  "success": true,
  "sessionToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 600,
  "message": "Authentication successful"
}
```

**Notes**:
- Session token expires in 10 minutes
- Token is required for VC issuance
- Issuer verifies signature matches DID address

## Issue Credentials

After successful DID-Auth, client can request verifiable credentials.

### Request VC

```bash
POST /issuer/issue-vc
Authorization: Bearer <sessionToken>
Content-Type: application/json

{
  "subjectDid": "did:pkh:eip155:31337:0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
  "credentialSubject": {
    "name": "My Document",
    "documentCid": "QmTest123",
    "documentSha256": "abc123def456"
  },
  "validityDays": 365
}
```

Response:
```json
{
  "success": true,
  "jwtVc": "eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJkaWQ6cGtoOmVpcDE1NToxOjB4NzQyZDM1Y2M2NjM0YzA1MzI5MjVhM2I4NDRiYzllNzU5NWYwYmViIiwic3ViIjoiZGlkOnBraDplaXAxNTU6MzEzMzc6MHhmMzlmZDZlNTFhYWQ4OGY2ZjRjZTZhYjg4MjcyNzljZmZmYjkyMjY2IiwiaWF0IjoxNzA1MzE1ODAwLCJleHAiOjE3MzY4NTE4MDAsImp0aSI6ImFiYzEyMy11dWlkIiwidmMiOnsiQGNvbnRleHQiOlsiaHR0cHM6Ly93d3cudzMub3JnLzIwMTgvY3JlZGVudGlhbHMvdjEiXSwidHlwZSI6WyJWZXJpZmlhYmxlQ3JlZGVudGlhbCIsIkRvY3VtZW50Q3JlZGVudGlhbCJdLCJpc3N1ZXIiOiJkaWQ6cGtoOmVpcDE1NToxOjB4NzQyZDM1Y2M2NjM0YzA1MzI5MjVhM2I4NDRiYzllNzU5NWYwYmViIiwiaXNzdWFuY2VEYXRlIjoiMjAyNC0wMS0xNVQxMDozMDowMC4wMDBaIiwiZXhwaXJhdGlvbkRhdGUiOiIyMDI1LTAxLTE1VDEwOjMwOjAwLjAwMFoiLCJjcmVkZW50aWFsU3ViamVjdCI6eyJpZCI6ImRpZDpwa2g6ZWlwMTU1OjMxMzM3OjB4ZjM5ZmQ2ZTUxYWFkODhmNmY0Y2U2YWI4ODI3Mjc5Y2ZmZmI5MjI2NiIsIm5hbWUiOiJNeSBEb2N1bWVudCIsImRvY3VtZW50Q2lkIjoiUW1UZXN0MTIzIiwiZG9jdW1lbnRTaGEyNTYiOiJhYmMxMjNkZWY0NTYifX19.signature",
  "jti": "abc123-uuid",
  "expiresAt": "2025-01-15T10:30:00.000Z"
}
```

### Verify VC

Anyone can verify a JWT-VC:

```bash
GET /issuer/verify-vc?jwt=<jwtVc>
```

Response:
```json
{
  "success": true,
  "valid": true,
  "expired": false,
  "payload": {
    "iss": "did:pkh:eip155:1:0x742d35cc6634c0532925a3b844bc9e7595f0beb",
    "sub": "did:pkh:eip155:31337:0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
    "iat": 1705315800,
    "exp": 1736851800,
    "jti": "abc123-uuid",
    "vc": {
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      "type": ["VerifiableCredential", "DocumentCredential"],
      "issuer": "did:pkh:eip155:1:0x742d35cc6634c0532925a3b844bc9e7595f0beb",
      "credentialSubject": {
        "id": "did:pkh:eip155:31337:0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
        "name": "My Document",
        "documentCid": "QmTest123",
        "documentSha256": "abc123def456"
      }
    }
  }
}
```

## Example cURL Commands

### Complete Flow

```bash
# 1. Request challenge
curl "http://localhost:8080/issuer/challenge?did=did:pkh:eip155:31337:0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"

# Response: { "success": true, "challenge": "abc-123", "expiresIn": 300 }

# 2. Sign challenge with MetaMask (use client or ethers.js)
# signature = await wallet.signMessage(challenge)

# 3. Verify challenge
curl -X POST http://localhost:8080/issuer/verify-challenge \
  -H "Content-Type: application/json" \
  -d '{
    "did": "did:pkh:eip155:31337:0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
    "challenge": "abc-123",
    "signature": "0x..."
  }'

# Response: { "success": true, "sessionToken": "eyJ...", "expiresIn": 600 }

# 4. Issue VC
curl -X POST http://localhost:8080/issuer/issue-vc \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "subjectDid": "did:pkh:eip155:31337:0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
    "credentialSubject": {
      "name": "My Document",
      "documentCid": "QmTest123",
      "documentSha256": "abc123def456"
    },
    "validityDays": 365
  }'

# Response: { "success": true, "jwtVc": "eyJ...", "jti": "uuid", "expiresAt": "..." }

# 5. Verify VC
curl "http://localhost:8080/issuer/verify-vc?jwt=eyJ..."

# Response: { "success": true, "valid": true, "expired": false, "payload": {...} }
```

### Using Hardhat Test Account

For testing, use the first Hardhat account:

```bash
# Private key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
# Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
# DID: did:pkh:eip155:31337:0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266

# Sign challenge with ethers.js
node -e "
const { ethers } = require('ethers');
const wallet = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
const challenge = 'your-challenge-here';
wallet.signMessage(challenge).then(sig => console.log(sig));
"
```

## Client Integration

### Install Client Dependencies

```bash
cd client
npm install
```

### Use DID Panel

1. Start client: `npm run dev`
2. Navigate to DID Panel page
3. Click "Connect Wallet & Show DID"
4. MetaMask will prompt for connection
5. Your DID will be displayed

### Programmatic Usage

```typescript
import { 
  getConnectedAddress, 
  createDidPkh, 
  signChallenge, 
  getChainId 
} from './lib/did';

async function authenticateAndIssueVC() {
  // 1. Connect wallet and create DID
  const address = await getConnectedAddress();
  const chainId = await getChainId();
  const did = createDidPkh(address, chainId);
  
  console.log('DID:', did);
  
  // 2. Request challenge
  const challengeRes = await fetch(
    `http://localhost:8080/issuer/challenge?did=${did}`
  );
  const { challenge } = await challengeRes.json();
  
  console.log('Challenge:', challenge);
  
  // 3. Sign challenge with MetaMask
  const { signature } = await signChallenge(challenge);
  
  console.log('Signature:', signature);
  
  // 4. Verify challenge and get session token
  const verifyRes = await fetch(
    'http://localhost:8080/issuer/verify-challenge',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ did, challenge, signature })
    }
  );
  const { sessionToken } = await verifyRes.json();
  
  console.log('Session Token:', sessionToken);
  
  // 5. Issue VC
  const vcRes = await fetch(
    'http://localhost:8080/issuer/issue-vc',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subjectDid: did,
        credentialSubject: {
          name: 'My Document',
          documentCid: 'QmTest123',
          documentSha256: 'abc123def456'
        },
        validityDays: 365
      })
    }
  );
  const { jwtVc, jti } = await vcRes.json();
  
  console.log('JWT-VC:', jwtVc);
  console.log('JTI:', jti);
  
  return { jwtVc, jti };
}

// Run
authenticateAndIssueVC().catch(console.error);
```

## Testing

### Run Tests

```bash
cd issuer
npm test
```

Tests cover:
- Challenge generation and validation
- Signature verification
- Session token management
- VC issuance
- Error handling

### Test Output

```
 PASS  tests/didAuth.test.ts
  DID-Auth Flow
    GET /issuer/challenge
      ✓ should generate a challenge for valid DID (50ms)
      ✓ should reject invalid DID format (10ms)
      ✓ should require DID parameter (5ms)
    POST /issuer/verify-challenge
      ✓ should verify valid signature and return session token (100ms)
      ✓ should reject invalid signature (20ms)
      ✓ should reject wrong challenge (15ms)
      ✓ should reject malformed requests (10ms)

 PASS  tests/issueVc.test.ts
  VC Issuance
    POST /issuer/issue-vc
      ✓ should issue JWT-VC with valid session token (80ms)
      ✓ should reject request without session token (10ms)
      ✓ should reject invalid session token (15ms)
      ✓ should reject mismatched subject DID (20ms)
    GET /issuer/verify-vc
      ✓ should verify valid JWT-VC (30ms)
      ✓ should reject invalid JWT format (10ms)

Test Suites: 2 passed, 2 total
Tests:       13 passed, 13 total
```

## Troubleshooting

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::8080
```

**Solution**: Change PORT in `.env` or kill the process using port 8080:

```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8080 | xargs kill -9
```

### MetaMask Not Installed

```
Error: MetaMask not installed
```

**Solution**: Install MetaMask browser extension from https://metamask.io

### Invalid Signature

```
{
  "success": false,
  "error": "Signature verification failed. Address mismatch."
}
```

**Solution**: Ensure you're signing with the correct account that matches the DID.

## Next Steps

1. ✅ Generate issuer keys
2. ✅ Start issuer server
3. ✅ Test DID-Auth flow
4. ✅ Issue test credential
5. 🔄 Integrate with client application
6. 🔄 Deploy to production
7. 🔄 Set up monitoring and logging

## Resources

- [W3C DID Core Specification](https://www.w3.org/TR/did-core/)
- [W3C Verifiable Credentials Data Model](https://www.w3.org/TR/vc-data-model/)
- [DID:PKH Method Specification](https://github.com/w3c-ccg/did-pkh/blob/main/did-pkh-method-draft.md)
- [EIP-191: Signed Data Standard](https://eips.ethereum.org/EIPS/eip-191)
- [JWT RFC 7519](https://tools.ietf.org/html/rfc7519)

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review the [issuer/README.md](issuer/README.md)
3. Check test files for examples
4. Review audit logs in `issuer/logs/issuance.log`
