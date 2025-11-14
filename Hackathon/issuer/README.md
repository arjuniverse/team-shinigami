# DID-Auth & JWT-VC Issuer Service

A TypeScript-based issuer service that provides DID-Auth (Decentralized Identifier Authentication) and JWT-VC (JSON Web Token Verifiable Credentials) issuance.

## Features

- **DID-Auth Challenge-Response Flow**: Authenticate users using their DID and MetaMask signatures
- **JWT-VC Issuance**: Issue signed verifiable credentials as JWTs
- **ES256K Signing**: Uses ECDSA secp256k1 for JWT signatures
- **Session Management**: Short-lived session tokens for authenticated users
- **Audit Logging**: Tracks all credential issuances (no PII)
- **TypeScript**: Fully typed for better developer experience

## Architecture

```
┌─────────┐                    ┌─────────┐                    ┌─────────┐
│ Client  │                    │ Issuer  │                    │MetaMask │
│         │                    │ Server  │                    │         │
└────┬────┘                    └────┬────┘                    └────┬────┘
     │                              │                              │
     │ 1. GET /challenge?did=...    │                              │
     ├─────────────────────────────>│                              │
     │                              │                              │
     │ 2. { challenge: "nonce" }    │                              │
     │<─────────────────────────────┤                              │
     │                              │                              │
     │ 3. Sign challenge            │                              │
     ├──────────────────────────────┼─────────────────────────────>│
     │                              │                              │
     │ 4. { signature }             │                              │
     │<─────────────────────────────┼──────────────────────────────┤
     │                              │                              │
     │ 5. POST /verify-challenge    │                              │
     │    { did, challenge, sig }   │                              │
     ├─────────────────────────────>│                              │
     │                              │                              │
     │ 6. { sessionToken }          │                              │
     │<─────────────────────────────┤                              │
     │                              │                              │
     │ 7. POST /issue-vc            │                              │
     │    Authorization: Bearer ... │                              │
     ├─────────────────────────────>│                              │
     │                              │                              │
     │ 8. { jwtVc }                 │                              │
     │<─────────────────────────────┤                              │
     │                              │                              │
```

## Quick Start

### 1. Install Dependencies

```bash
cd issuer
npm install
```

### 2. Generate Issuer Keys

```bash
npm run generate-key
```

This will:
- Generate a new ECDSA secp256k1 keypair
- Create an issuer DID (did:pkh format)
- Output a `.env.generated` file with configuration

### 3. Configure Environment

```bash
cp .env.generated .env
# Review and customize .env as needed
```

Required environment variables:
- `ISSUER_PRIVATE_KEY`: Private key for signing JWTs (ES256K)
- `ISSUER_DID`: Issuer's DID (did:pkh:eip155:...)
- `SESSION_SECRET`: Secret for session token signing
- `VC_TOKEN_TTL`: Credential validity in days (default: 365)
- `PORT`: Server port (default: 8080)

### 4. Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:8080`

### 5. Build for Production

```bash
npm run build
npm start
```

## API Endpoints

### Health Check

```bash
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "issuer",
  "version": "1.0.0"
}
```

### 1. Request Challenge

```bash
GET /issuer/challenge?did=<did>
```

Parameters:
- `did`: User's DID (format: `did:pkh:eip155:<chainId>:<address>`)

Response:
```json
{
  "success": true,
  "challenge": "uuid-timestamp",
  "expiresIn": 300
}
```

Example:
```bash
curl "http://localhost:8080/issuer/challenge?did=did:pkh:eip155:31337:0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
```

### 2. Verify Challenge

```bash
POST /issuer/verify-challenge
Content-Type: application/json

{
  "did": "did:pkh:eip155:31337:0xf39fd...",
  "challenge": "uuid-timestamp",
  "signature": "0x..."
}
```

Response:
```json
{
  "success": true,
  "sessionToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 600,
  "message": "Authentication successful"
}
```

Example:
```bash
curl -X POST http://localhost:8080/issuer/verify-challenge \
  -H "Content-Type: application/json" \
  -d '{
    "did": "did:pkh:eip155:31337:0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
    "challenge": "abc-123",
    "signature": "0x..."
  }'
```

### 3. Issue Verifiable Credential

```bash
POST /issuer/issue-vc
Authorization: Bearer <sessionToken>
Content-Type: application/json

{
  "subjectDid": "did:pkh:eip155:31337:0xf39fd...",
  "credentialSubject": {
    "name": "Document Name",
    "documentCid": "QmXxx...",
    "documentSha256": "abc123..."
  },
  "validityDays": 365
}
```

Response:
```json
{
  "success": true,
  "jwtVc": "eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ...",
  "jti": "uuid",
  "expiresAt": "2025-01-15T10:30:00.000Z"
}
```

Example:
```bash
curl -X POST http://localhost:8080/issuer/issue-vc \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "subjectDid": "did:pkh:eip155:31337:0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
    "credentialSubject": {
      "name": "My Document",
      "documentCid": "QmTest123",
      "documentSha256": "abc123def456"
    },
    "validityDays": 30
  }'
```

### 4. Verify Credential

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
    "iss": "did:pkh:eip155:1:0x...",
    "sub": "did:pkh:eip155:31337:0xf39fd...",
    "iat": 1705315800,
    "exp": 1736851800,
    "jti": "uuid",
    "vc": {
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      "type": ["VerifiableCredential", "DocumentCredential"],
      "issuer": "did:pkh:eip155:1:0x...",
      "credentialSubject": {
        "id": "did:pkh:eip155:31337:0xf39fd...",
        "name": "My Document"
      }
    }
  }
}
```

## JWT-VC Structure

The issued JWT-VC follows the W3C Verifiable Credentials Data Model:

```json
{
  "header": {
    "alg": "ES256K",
    "typ": "JWT"
  },
  "payload": {
    "iss": "did:pkh:eip155:1:0x...",
    "sub": "did:pkh:eip155:31337:0xf39fd...",
    "iat": 1705315800,
    "exp": 1736851800,
    "jti": "unique-uuid",
    "vc": {
      "@context": [
        "https://www.w3.org/2018/credentials/v1"
      ],
      "type": ["VerifiableCredential", "DocumentCredential"],
      "issuer": "did:pkh:eip155:1:0x...",
      "issuanceDate": "2024-01-15T10:30:00.000Z",
      "expirationDate": "2025-01-15T10:30:00.000Z",
      "credentialSubject": {
        "id": "did:pkh:eip155:31337:0xf39fd...",
        "name": "Document Name",
        "documentCid": "QmXxx...",
        "documentSha256": "abc123..."
      }
    }
  },
  "signature": "..."
}
```

## Testing

### Run Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Test Coverage

Tests cover:
- Challenge generation and validation
- Signature verification
- Session token management
- VC issuance with various scenarios
- Error handling and validation

## Security Considerations

### Private Key Management

- **Never commit** `ISSUER_PRIVATE_KEY` to version control
- Store private keys in secure environment variables
- Use Hardware Security Modules (HSM) in production
- Rotate keys periodically
- Backup keys securely

### Session Management

- Session tokens expire after 10 minutes
- Challenges expire after 5 minutes
- Challenges are single-use only
- All tokens use cryptographically secure random generation

### Input Validation

- All inputs are validated using express-validator
- DID format validation (did:pkh:eip155:...)
- Signature format validation (0x + 130 hex chars)
- Credential subject validation

### Audit Logging

All credential issuances are logged to `logs/issuance.log`:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "issuer": "did:pkh:eip155:1:0x...",
  "subject": "did:pkh:eip155:31337:0xf39fd...",
  "jti": "uuid",
  "vcType": ["VerifiableCredential", "DocumentCredential"],
  "action": "VC_ISSUED"
}
```

**Note**: No PII (Personally Identifiable Information) is logged.

## Development

### Project Structure

```
issuer/
├── src/
│   ├── index.ts              # Main server
│   ├── routes/
│   │   ├── didAuth.ts        # DID-Auth endpoints
│   │   └── vc.ts             # VC issuance endpoints
│   └── keys/
│       └── generateKey.ts    # Key generation script
├── tests/
│   ├── didAuth.test.ts       # DID-Auth tests
│   └── issueVc.test.ts       # VC issuance tests
├── logs/                     # Audit logs
├── dist/                     # Compiled output
├── .env                      # Environment config (gitignored)
├── .env.example              # Example config
├── tsconfig.json             # TypeScript config
├── jest.config.js            # Jest config
└── package.json              # Dependencies
```

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run production server
- `npm run generate-key` - Generate new issuer keypair
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run clean` - Remove build artifacts

## Troubleshooting

### Missing Environment Variables

```
❌ Missing required environment variables:
   - ISSUER_PRIVATE_KEY
   - ISSUER_DID
   - SESSION_SECRET

💡 Run: npm run generate-key to generate configuration
   Then: cp .env.generated .env
```

**Solution**: Run `npm run generate-key` and copy the generated `.env.generated` to `.env`.

### Invalid Signature

```
{
  "success": false,
  "error": "Signature verification failed. Address mismatch."
}
```

**Causes**:
- Wrong private key used to sign
- Challenge was modified
- DID doesn't match signer address

**Solution**: Ensure the signature is created with the private key corresponding to the DID's address.

### Session Expired

```
{
  "success": false,
  "error": "Session expired. Please authenticate again."
}
```

**Solution**: Session tokens expire after 10 minutes. Request a new challenge and authenticate again.

### Challenge Expired

```
{
  "success": false,
  "error": "Challenge expired. Request a new challenge."
}
```

**Solution**: Challenges expire after 5 minutes. Request a new challenge.

## Integration with Client

See the client's DID panel (`client/src/pages/DidPanel.tsx`) for a complete integration example.

Basic flow:

```typescript
import { getConnectedAddress, createDidPkh, signChallenge, getChainId } from './lib/did';

// 1. Connect wallet and create DID
const address = await getConnectedAddress();
const chainId = await getChainId();
const did = createDidPkh(address, chainId);

// 2. Request challenge
const challengeRes = await fetch(`http://localhost:8080/issuer/challenge?did=${did}`);
const { challenge } = await challengeRes.json();

// 3. Sign challenge with MetaMask
const { signature } = await signChallenge(challenge);

// 4. Verify challenge and get session token
const verifyRes = await fetch('http://localhost:8080/issuer/verify-challenge', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ did, challenge, signature })
});
const { sessionToken } = await verifyRes.json();

// 5. Issue VC
const vcRes = await fetch('http://localhost:8080/issuer/issue-vc', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${sessionToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    subjectDid: did,
    credentialSubject: {
      name: 'My Document',
      documentCid: 'QmXxx...'
    },
    validityDays: 365
  })
});
const { jwtVc } = await vcRes.json();
```

## License

MIT
