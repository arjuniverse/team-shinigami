# DID Credential Vault MVP

A decentralized identity and verifiable credential system demonstrating W3C standards-compliant credential issuance, storage, and verification.

## Overview

This MVP is a complete implementation of a decentralized identity (DID) and verifiable credential (VC) system that follows W3C standards. It enables users to:

- Create self-sovereign decentralized identifiers (DIDs) in their browser
- Upload encrypted files to Cloudflare R2 storage
- Request and receive cryptographically signed verifiable credentials
- Store credentials securely in an encrypted browser-based vault
- Create verifiable presentations (VPs) to share credentials selectively
- Verify the authenticity and validity of presented credentials
- Anchor credential hashes on a local blockchain for immutability

The system consists of three main components:

1. **Client (React/Vite)** - Browser-based UI for credential holders and verifiers
2. **Issuer (Node.js/Express)** - Backend service for credential issuance and verification
3. **Blockchain (Hardhat)** - Local Ethereum network with credential anchoring smart contract

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v18.0.0 or higher) - [Download](https://nodejs.org/)
- **npm** (v9.0.0 or higher) - Comes with Node.js
- **Git** - [Download](https://git-scm.com/)
- **Cloudflare R2 Account** (optional for file storage) - [Sign up](https://www.cloudflare.com/products/r2/)

To verify your installations:

```bash
node --version  # Should show v18.0.0 or higher
npm --version   # Should show v9.0.0 or higher
git --version   # Should show git version
```

## Project Structure

```
did-credential-vault-mvp/
├── client/                      # React frontend application
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── UploadAndCreateDid.jsx
│   │   │   ├── Vault.jsx
│   │   │   └── Verifier.jsx
│   │   ├── utils/               # Utility modules
│   │   │   ├── cryptoVault.js   # Encrypted vault operations
│   │   │   ├── didManager.js    # DID generation and signing
│   │   │   └── r2Upload.js      # File encryption and upload
│   │   ├── App.jsx              # Main application component
│   │   └── main.jsx             # Application entry point
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
├── issuer/                      # Node.js backend service
│   ├── scripts/
│   │   └── issue-sample.js      # CLI testing script
│   ├── index.js                 # Express server
│   ├── veramo-agent.js          # Veramo configuration
│   ├── revoke.json              # Revocation registry
│   ├── package.json
│   └── .env.example
├── blockchain/                  # Hardhat blockchain environment
│   ├── contracts/
│   │   └── Anchor.sol           # Credential anchoring contract
│   ├── scripts/
│   │   └── deploy.js            # Contract deployment script
│   ├── hardhat.config.js
│   ├── package.json
│   └── .env.example
├── .gitignore
└── README.md                    # This file
```

## Quick Start

### 1. Clone and Install Dependencies

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd did-credential-vault-mvp

# Install blockchain dependencies
cd blockchain
npm install
cd ..

# Install issuer dependencies
cd issuer
npm install
cd ..

# Install client dependencies
cd client
npm install
cd ..
```

### 2. Configure Environment Variables

#### Blockchain Component

No environment configuration needed for local development. The Hardhat node runs on default settings.

#### Issuer Service

Create `issuer/.env` file based on `issuer/.env.example`:

```env
# Server Configuration
PORT=8080

# Cloudflare R2 Configuration
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=<your-access-key>
R2_SECRET_ACCESS_KEY=<your-secret-key>
R2_BUCKET_NAME=did-vault-mvp

# Blockchain Configuration
HARDHAT_NETWORK_URL=http://localhost:8545
```

**Getting R2 Credentials:**
1. Log in to your Cloudflare dashboard
2. Navigate to R2 Object Storage
3. Create a new bucket named `did-vault-mvp`
4. Generate API tokens with read/write permissions
5. Copy the Account ID, Access Key ID, and Secret Access Key

**Note:** The system can run without R2 configuration, but file upload functionality will not work.

#### Client Application

Create `client/.env` file based on `client/.env.example`:

```env
VITE_ISSUER_API_URL=http://localhost:8080
```

### 3. Start the Services

You'll need **three separate terminal windows** to run all components:

**Terminal 1 - Start Hardhat Local Blockchain:**
```bash
cd blockchain
npx hardhat node
```

This starts a local Ethereum network on `http://localhost:8545`. Keep this terminal running.

**Terminal 2 - Deploy Contract and Start Issuer Service:**
```bash
# Deploy the Anchor contract
cd blockchain
npx hardhat run --network localhost scripts/deploy.js

# Start the issuer service
cd ../issuer
npm start
```

The issuer service will start on `http://localhost:8080`. Keep this terminal running.

**Terminal 3 - Start Client Application:**
```bash
cd client
npm run dev
```

The client will start on `http://localhost:5173`. Keep this terminal running.

### 4. Access the Application

Open your web browser and navigate to:

```
http://localhost:5173
```

You should see the DID Credential Vault MVP interface with three main sections:
- Upload & Create DID
- Vault
- Verifier


## Complete Demo Flow Walkthrough

This section provides a step-by-step guide through the entire credential lifecycle.

### Step 1: Upload an Encrypted File

1. Navigate to the **"Upload & Create DID"** section
2. Click the **"Choose File"** button and select any file from your computer
3. Click the **"Upload Encrypted File"** button
4. The application will:
   - Encrypt the file client-side using AES-GCM encryption
   - Upload the encrypted file to Cloudflare R2 storage via the issuer service
   - Display the storage key (e.g., `encrypted-doc-abc123`)
5. **Save the storage key** - you'll need it for the credential request

**What's happening behind the scenes:**
- The file is encrypted in your browser using WebCrypto API
- Only the encrypted version is transmitted over the network
- The encryption key never leaves your browser
- R2 storage receives only the encrypted file

### Step 2: Generate Your Decentralized Identifier (DID)

1. In the same section, click the **"Generate DID"** button
2. The application will:
   - Create a `did:key` identifier using cryptographic key generation
   - Store the DID and private key in browser localStorage
   - Display your DID (e.g., `did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH`)
3. **Copy your DID** - you'll need it for the credential request

**What's happening behind the scenes:**
- A new Ed25519 key pair is generated in your browser
- The public key is encoded as a `did:key` identifier
- The private key is stored locally for signing operations
- No external network calls are made

### Step 3: Request a Verifiable Credential

1. Click the **"Request Credential"** button
2. The application will:
   - Send your DID and file storage claims to the issuer service
   - The issuer creates a W3C-compliant Verifiable Credential
   - The VC is signed with the issuer's DID private key
   - The signed VC is returned to your browser
3. When prompted, **enter a passphrase** to encrypt and store the credential
4. The VC is encrypted and saved in your browser's vault
5. A success message confirms the credential is stored

**What's happening behind the scenes:**
- The issuer service uses Veramo to create a standards-compliant VC
- The VC includes your DID as the subject and the storage key as a claim
- The VC is signed using JWT proof format
- Your passphrase derives an encryption key using PBKDF2
- The VC is encrypted with AES-GCM before storage

### Step 4: View Your Credentials in the Vault

1. Navigate to the **"Vault"** section
2. Enter your passphrase to unlock the vault
3. The application will:
   - Decrypt all stored credentials using your passphrase
   - Display a list of your credentials with details
4. You can see:
   - Credential ID
   - Issuer DID
   - Issuance date
   - Claims (storage key, document type, etc.)

**What's happening behind the scenes:**
- Encrypted credentials are retrieved from localStorage
- Your passphrase derives the decryption key
- Each credential is decrypted and parsed
- The vault displays the decrypted credential data

### Step 5: Create a Verifiable Presentation

1. In the Vault section, **select one or more credentials** using checkboxes
2. Click the **"Create Presentation"** button
3. The application will:
   - Create a W3C-compliant Verifiable Presentation
   - Include the selected credentials in the VP
   - Sign the VP with your DID private key
   - Display the VP JSON structure
4. Click **"Copy VP"** to copy the presentation to your clipboard

**What's happening behind the scenes:**
- A VP wrapper is created containing your selected VCs
- The VP is signed with your private key to prove you control the DIDs
- The VP includes proof of holder binding
- The entire VP is serialized as JSON

### Step 6: Verify a Presentation

1. Navigate to the **"Verifier"** section
2. Paste the VP JSON into the textarea (or upload a VP JSON file)
3. Click the **"Verify Presentation"** button
4. The application will:
   - Send the VP to the issuer service for verification
   - The issuer verifies all cryptographic signatures
   - The issuer checks the revocation status of each credential
   - Return the verification result
5. View the result:
   - ✅ **Verified: true** - All signatures valid, no credentials revoked
   - ❌ **Verified: false** - Invalid signature or revoked credential

**What's happening behind the scenes:**
- The issuer service uses Veramo to verify VP and VC signatures
- Each credential ID is checked against the revocation registry
- DID resolution confirms the signers' identities
- The verification result includes detailed reasons for any failures

### Step 7: Anchor Credential Hash (Optional)

This step demonstrates blockchain anchoring for credential immutability.

1. Use a tool like `curl` or Postman to call the anchor endpoint:

```bash
curl -X POST http://localhost:8080/anchor \
  -H "Content-Type: application/json" \
  -d '{"dataHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"}'
```

2. The issuer service will:
   - Submit a transaction to the Anchor smart contract
   - Store the hash on the blockchain
   - Return the transaction hash and block number

**What's happening behind the scenes:**
- The hash is submitted to the Anchor.sol contract on the local blockchain
- The contract stores the hash in a mapping and emits an event
- The transaction is mined and included in a block
- The hash is now immutably recorded on the blockchain


## API Endpoints

The issuer service exposes the following REST API endpoints:

### POST /upload

Upload an encrypted file to Cloudflare R2 storage.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: Encrypted file as form data

**Response:**
```json
{
  "storageKey": "encrypted-doc-abc123",
  "bucket": "did-vault-mvp",
  "timestamp": "2025-11-13T12:00:00Z"
}
```

### POST /issue

Issue a verifiable credential.

**Request:**
```json
{
  "subjectDid": "did:key:z6Mk...",
  "claims": {
    "storageKey": "encrypted-doc-abc123",
    "docType": "passport",
    "uploadTimestamp": "2025-11-13T12:00:00Z"
  }
}
```

**Response:**
```json
{
  "vc": {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    "type": ["VerifiableCredential"],
    "issuer": { "id": "did:key:z6Mk..." },
    "credentialSubject": { ... },
    "proof": { ... }
  }
}
```

### POST /verify

Verify a verifiable presentation.

**Request:**
```json
{
  "vp": {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    "type": ["VerifiablePresentation"],
    "holder": "did:key:z6Mk...",
    "verifiableCredential": [ ... ],
    "proof": { ... }
  }
}
```

**Response:**
```json
{
  "verified": true,
  "reason": "All signatures valid, no credentials revoked"
}
```


### POST /anchor

Anchor a credential hash on the blockchain.

**Request:**
```json
{
  "dataHash": "0x1234567890abcdef..."
}
```

**Response:**
```json
{
  "txHash": "0xabcdef...",
  "blockNumber": 42
}
```

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (Client)                      │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │  React UI      │  │ Encrypted    │  │  DID Manager    │ │
│  │  Components    │  │ Vault        │  │  (did:key)      │ │
│  │                │  │ (localStorage)│  │                 │ │
│  └────────┬───────┘  └──────────────┘  └─────────────────┘ │
│           │                                                  │
└───────────┼──────────────────────────────────────────────────┘
            │ HTTPS/HTTP
            │
┌───────────▼──────────────────────────────────────────────────┐
│                   Issuer Service (Node.js)                   │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │  Express API   │  │ Veramo Agent │  │  Revocation     │ │
│  │  /upload       │  │ - KeyManager │  │  Registry       │ │
│  │  /issue        │  │ - DIDManager │  │  (revoke.json)  │ │
│  │  /verify       │  │ - Credential │  │                 │ │
│  │  /anchor       │  │   Plugin     │  │                 │ │
│  └────────┬───────┘  └──────────────┘  └─────────────────┘ │
└───────────┼──────────────────────────────────────────────────┘
            │
            ├─────────────────┐
            │                 │
┌───────────▼──────────┐  ┌───▼──────────────────────────────┐
│  Cloudflare R2       │  │  Hardhat Local Blockchain        │
│  Object Storage      │  │  ┌────────────────────────────┐  │
│                      │  │  │  Anchor.sol Contract       │  │
│  - Encrypted files   │  │  │  - anchor(bytes32 hash)    │  │
│  - S3-compatible API │  │  │  - isAnchored(bytes32)     │  │
│                      │  │  └────────────────────────────┘  │
└──────────────────────┘  └──────────────────────────────────┘
```

### Component Interaction Flow

```
1. File Upload Flow:
   Client → Encrypt File → Issuer /upload → R2 Storage → Storage Key → Client

2. Credential Issuance Flow:
   Client → POST /issue (DID + Claims) → Veramo Agent → Signed VC → Client → Encrypt → Vault

3. Presentation Creation Flow:
   Client → Unlock Vault → Select VCs → Sign VP → Display VP JSON

4. Verification Flow:
   Client → POST /verify (VP) → Veramo Agent → Check Revocation → Verification Result → Client

5. Blockchain Anchoring Flow:
   Client/Issuer → POST /anchor (Hash) → Hardhat Node → Anchor Contract → TX Hash → Client
```


## Technology Stack

### Frontend (Client)
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **WebCrypto API** - Browser-native encryption (AES-GCM, PBKDF2)
- **@veramo/did-provider-key** - DID generation
- **localStorage** - Encrypted credential storage

### Backend (Issuer)
- **Node.js 18+** - Runtime environment
- **Express** - Web framework
- **Veramo** - Verifiable credential framework
  - `@veramo/core` - Core agent functionality
  - `@veramo/credential-w3c` - W3C VC plugin
  - `@veramo/did-manager` - DID management
  - `@veramo/did-provider-key` - did:key provider
  - `@veramo/key-manager` - Key management
  - `@veramo/kms-local` - Local key storage
- **AWS SDK v3** - S3-compatible R2 client
- **ethers.js** - Blockchain interaction

### Blockchain
- **Hardhat** - Ethereum development environment
- **Solidity** - Smart contract language
- **ethers.js** - Contract deployment and interaction

### Standards Compliance
- **W3C Verifiable Credentials Data Model 1.1** - VC/VP structure
- **W3C DID Core** - Decentralized identifier specification
- **JWT Proof Format** - Credential signing method

## Troubleshooting

### Common Issues and Solutions

#### Issue: Hardhat Node Connection Refused

**Error Message:**
```
Error: connect ECONNREFUSED 127.0.0.1:8545
```

**Cause:** The Hardhat local blockchain is not running.

**Solution:**
1. Open a new terminal window
2. Navigate to the blockchain directory: `cd blockchain`
3. Start the Hardhat node: `npx hardhat node`
4. Keep the terminal running
5. Restart the issuer service

#### Issue: R2 Upload Failures

**Error Message:**
```
Error: Failed to upload to R2
```

**Possible Causes and Solutions:**

1. **Missing R2 Credentials**
   - Check that `issuer/.env` contains valid R2 credentials
   - Verify the R2_ENDPOINT, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY

2. **Bucket Does Not Exist**
   - Log in to Cloudflare dashboard
   - Create a bucket with the name specified in R2_BUCKET_NAME
   - Ensure the bucket is in the same account as your API tokens

3. **Invalid API Tokens**
   - Regenerate API tokens in Cloudflare dashboard
   - Ensure tokens have read and write permissions
   - Update the credentials in `issuer/.env`

#### Issue: Vault Decryption Fails

**Error Message:**
```
Error: Wrong passphrase or corrupted data
```

**Cause:** The passphrase entered doesn't match the one used to encrypt the credentials.

**Solution:**
- Ensure you're using the exact same passphrase (case-sensitive)
- If you've forgotten the passphrase, the credentials cannot be recovered
- Clear localStorage and start fresh: Open browser DevTools → Application → Local Storage → Clear


#### Issue: CORS Errors in Browser

**Error Message:**
```
Access to fetch at 'http://localhost:8080/issue' blocked by CORS policy
```

**Cause:** The issuer service is not running or CORS is misconfigured.

**Solution:**
1. Verify the issuer service is running on port 8080
2. Check the terminal for any startup errors
3. Ensure `client/.env` has the correct VITE_ISSUER_API_URL
4. Restart both the issuer service and client application

#### Issue: Contract Deployment Fails

**Error Message:**
```
Error: Cannot find module './deployed-address.json'
```

**Cause:** The Anchor contract hasn't been deployed yet.

**Solution:**
1. Ensure Hardhat node is running
2. Deploy the contract: `cd blockchain && npx hardhat run --network localhost scripts/deploy.js`
3. Verify `deployed-address.json` is created in the blockchain directory
4. Restart the issuer service

#### Issue: DID Generation Fails

**Error Message:**
```
Error: Crypto API not available
```

**Cause:** Your browser doesn't support WebCrypto API or you're not using HTTPS/localhost.

**Solution:**
- Use a modern browser (Chrome, Firefox, Safari, Edge)
- Ensure you're accessing via `http://localhost:5173` (not an IP address)
- Update your browser to the latest version

#### Issue: Verification Always Returns False

**Possible Causes and Solutions:**

1. **Credential Revoked**
   - Check `issuer/revoke.json` to see if the credential ID is listed
   - Remove the ID from the revoked list if it was added by mistake

2. **Invalid Signature**
   - Ensure the VP hasn't been modified after creation
   - Verify the holder's DID matches the one used to sign the VP

3. **Issuer Service Restarted**
   - The issuer DID changes on each restart (in-memory keys)
   - Re-issue credentials after restarting the issuer service

#### Issue: Port Already in Use

**Error Message:**
```
Error: listen EADDRINUSE: address already in use :::8080
```

**Cause:** Another process is using the required port.

**Solution:**

On Windows:
```bash
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

On macOS/Linux:
```bash
lsof -ti:8080 | xargs kill -9
```

Or change the port in the respective `.env` file.

### Debug Mode

To enable verbose logging:

**Issuer Service:**
Add to `issuer/.env`:
```env
DEBUG=*
NODE_ENV=development
```

**Client Application:**
Open browser DevTools (F12) and check the Console tab for detailed logs.


## Production Improvements

This MVP is designed for **local development and demonstration purposes only**. Before deploying to production, the following improvements are essential:

### 1. Secure Key Storage (Critical)

**Current Implementation:**
- Private keys stored in browser localStorage (unencrypted)
- In-memory key storage in issuer service (lost on restart)
- No key backup or recovery mechanism

**Production Requirements:**
- **Client:** Implement secure key storage using:
  - Hardware Security Modules (HSM) for enterprise
  - Secure Enclave on iOS devices
  - Android Keystore on Android devices
  - Browser extension with isolated storage
  - Hardware wallets (Ledger, Trezor) for high-value credentials
- **Issuer:** Use cloud-based key management:
  - AWS KMS (Key Management Service)
  - Azure Key Vault
  - Google Cloud KMS
  - HashiCorp Vault
- Implement key rotation policies
- Add key backup and recovery mechanisms
- Use multi-signature schemes for critical operations

**Code Locations:**
- `client/src/utils/didManager.js` - TODO comments for secure key storage
- `issuer/veramo-agent.js` - TODO comments for production key management

### 2. Production DID Methods (Critical)

**Current Implementation:**
- `did:key` method (ephemeral, not resolvable on-chain)
- Keys are not registered on any blockchain
- No DID document resolution
- No service endpoints

**Production Requirements:**
- Migrate to production DID methods:
  - **did:ethr** - Ethereum-based DIDs with on-chain registry
  - **did:web** - Web-based DIDs with HTTPS resolution
  - **did:ion** - Bitcoin-anchored DIDs (Microsoft ION)
  - **did:pkh** - Blockchain account-based DIDs
- Implement DID document resolution
- Add service endpoints for credential exchange
- Support DID rotation and recovery
- Implement DID deactivation

**Code Locations:**
- `issuer/veramo-agent.js` - TODO comments for did:ethr migration
- `client/src/utils/didManager.js` - DID generation logic

### 3. Selective Disclosure with BBS+ Signatures (High Priority)

**Current Implementation:**
- Full credential disclosure in presentations
- All claims are revealed to verifiers
- No privacy-preserving features

**Production Requirements:**
- Implement BBS+ (Boneh-Boyen-Shacham) signatures
- Enable selective disclosure of claims
- Allow holders to reveal only necessary attributes
- Implement zero-knowledge proofs for range proofs
- Support predicate proofs (e.g., "age > 18" without revealing exact age)

**Benefits:**
- Enhanced privacy for credential holders
- Compliance with data minimization principles (GDPR)
- Reduced risk of data leakage

**Code Locations:**
- `client/src/components/Vault.jsx` - TODO comments for selective disclosure
- `issuer/veramo-agent.js` - Credential creation logic


### 4. Persistent Database Storage (Critical)

**Current Implementation:**
- In-memory key storage (lost on restart)
- File-based revocation registry (`revoke.json`)
- Browser localStorage for credentials
- No data persistence across sessions

**Production Requirements:**
- Implement persistent database:
  - **PostgreSQL** - Relational data (users, credentials, audit logs)
  - **MongoDB** - Document storage for VCs/VPs
  - **Redis** - Caching layer for performance
- Database schema design:
  - Users table with authentication
  - Credentials table with indexing
  - Revocation registry with timestamps
  - Audit logs for compliance
- Implement database backups and replication
- Add database encryption at rest
- Implement connection pooling

**Code Locations:**
- `issuer/veramo-agent.js` - TODO comments for persistent storage
- `issuer/revoke.json` - File-based revocation registry

### 5. Production Revocation Registry (Critical)

**Current Implementation:**
- Simple JSON file with revoked credential IDs
- No timestamps or reasons for revocation
- Manual file editing required
- No scalability

**Production Requirements:**
- Implement W3C Status List 2021 specification
- Use blockchain-based revocation registry:
  - Ethereum smart contract for revocation status
  - IPFS for decentralized status list storage
- Add revocation reasons and timestamps
- Implement revocation API endpoints
- Support credential suspension (temporary revocation)
- Add revocation notifications to holders

**Code Locations:**
- `issuer/revoke.json` - Current revocation registry
- `issuer/index.js` - Verification endpoint with revocation checking

### 6. Enhanced Security Measures

**Authentication and Authorization:**
- Implement OAuth 2.0 / OpenID Connect
- Add API key authentication for issuer endpoints
- Implement role-based access control (RBAC)
- Add multi-factor authentication (MFA)

**API Security:**
- Implement rate limiting (e.g., 100 requests/minute)
- Add request validation and sanitization
- Implement API versioning
- Add request signing for integrity
- Use HTTPS/TLS for all communications

**Input Validation:**
- Validate all DID formats
- Sanitize all user inputs
- Implement JSON schema validation
- Add file type and size restrictions

**Code Additions Needed:**
- Add `express-rate-limit` middleware
- Implement `helmet` for security headers
- Add `joi` or `zod` for schema validation

### 7. Passphrase Security

**Current Implementation:**
- User-provided passphrase with no strength requirements
- Basic PBKDF2 key derivation
- No passphrase recovery mechanism

**Production Requirements:**
- Enforce passphrase strength requirements:
  - Minimum 12 characters
  - Mix of uppercase, lowercase, numbers, symbols
  - Check against common password lists
- Increase PBKDF2 iterations (100,000+)
- Implement passphrase recovery mechanisms:
  - Security questions
  - Recovery codes
  - Social recovery (trusted contacts)
- Add passphrase change functionality
- Implement account lockout after failed attempts

**Code Locations:**
- `client/src/utils/cryptoVault.js` - TODO comments for passphrase requirements


### 8. Scalability and Performance

**Infrastructure:**
- Deploy on cloud platforms (AWS, Azure, GCP)
- Implement load balancing
- Use CDN for static assets
- Add horizontal scaling for issuer service
- Implement message queues (RabbitMQ, AWS SQS) for async operations

**Caching:**
- Implement Redis caching for:
  - DID document resolution
  - Revocation status checks
  - Frequently accessed credentials
- Add cache invalidation strategies

**Monitoring:**
- Implement application monitoring (Datadog, New Relic)
- Add error tracking (Sentry, Rollbar)
- Set up logging aggregation (ELK stack, CloudWatch)
- Implement performance metrics
- Add uptime monitoring

### 9. Compliance and Auditing

**Audit Logging:**
- Log all credential issuance events
- Log all verification attempts
- Log all revocation actions
- Include timestamps, user IDs, and IP addresses
- Implement tamper-proof audit logs

**Compliance:**
- GDPR compliance (data minimization, right to erasure)
- CCPA compliance (California Consumer Privacy Act)
- SOC 2 compliance for enterprise customers
- Regular security audits and penetration testing

### 10. User Experience Improvements

**Mobile Support:**
- Develop native mobile apps (iOS, Android)
- Implement mobile wallet functionality
- Add QR code scanning for credential exchange
- Support biometric authentication

**Features:**
- Credential templates for common use cases
- Batch credential issuance
- Credential expiration and renewal
- Credential sharing via QR codes or deep links
- Notification system for credential updates

### 11. R2 Storage Improvements

**Current Implementation:**
- Server-side R2 credentials
- All uploads go through issuer service
- No access control on stored files

**Production Requirements:**
- Implement pre-signed URLs for direct client upload
- Add file access control and permissions
- Implement file expiration policies
- Add file encryption at rest (server-side)
- Implement file versioning
- Add file integrity verification

**Code Locations:**
- `issuer/index.js` - TODO comments for pre-signed URLs
- `client/src/utils/r2Upload.js` - Upload logic

### 12. Testing and Quality Assurance

**Testing Requirements:**
- Unit tests (80%+ code coverage)
- Integration tests for API endpoints
- End-to-end tests for user flows
- Security testing (OWASP Top 10)
- Performance testing and load testing
- Accessibility testing (WCAG 2.1 AA)

**CI/CD Pipeline:**
- Automated testing on every commit
- Automated deployment to staging
- Manual approval for production deployment
- Rollback mechanisms


## Standards and Specifications

This project implements the following W3C and industry standards:

### W3C Verifiable Credentials Data Model 1.1

The core specification for verifiable credentials and presentations.

- **Specification:** [https://www.w3.org/TR/vc-data-model/](https://www.w3.org/TR/vc-data-model/)
- **Implementation:** All VCs and VPs follow the W3C data model structure
- **Proof Format:** JWT (JSON Web Token) proof format

**Key Concepts:**
- **Verifiable Credential (VC):** A tamper-evident credential with cryptographic proof
- **Verifiable Presentation (VP):** A package of one or more VCs for verification
- **Issuer:** Entity that creates and signs credentials
- **Holder:** Entity that possesses and presents credentials
- **Verifier:** Entity that verifies presented credentials

### W3C Decentralized Identifiers (DIDs) v1.0

The specification for decentralized identifiers.

- **Specification:** [https://www.w3.org/TR/did-core/](https://www.w3.org/TR/did-core/)
- **Implementation:** Uses `did:key` method for MVP
- **DID Method:** [did:key Method Specification](https://w3c-ccg.github.io/did-method-key/)

**DID Structure:**
```
did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH
│   │   └─────────────────────────────────────────────────┘
│   │                    Multibase encoded public key
│   └─ Method name
└─ DID scheme
```

### Additional Standards

- **JSON Web Token (JWT):** [RFC 7519](https://tools.ietf.org/html/rfc7519)
- **JSON Web Signature (JWS):** [RFC 7515](https://tools.ietf.org/html/rfc7515)
- **Multibase:** [Multibase Specification](https://github.com/multiformats/multibase)
- **Multicodec:** [Multicodec Specification](https://github.com/multiformats/multicodec)

## Resources and Further Reading

### Official Documentation

- **Veramo Framework:** [https://veramo.io/](https://veramo.io/)
  - Comprehensive guide to Veramo agent configuration
  - Plugin documentation
  - DID method implementations

- **Hardhat:** [https://hardhat.org/](https://hardhat.org/)
  - Ethereum development environment
  - Smart contract testing and deployment
  - Local blockchain setup

- **Cloudflare R2:** [https://developers.cloudflare.com/r2/](https://developers.cloudflare.com/r2/)
  - S3-compatible object storage
  - API documentation
  - Pricing and limits

### Learning Resources

- **W3C Verifiable Credentials Primer:** [https://www.w3.org/TR/vc-data-model/#what-is-a-verifiable-credential](https://www.w3.org/TR/vc-data-model/#what-is-a-verifiable-credential)
- **DID Primer:** [https://github.com/WebOfTrustInfo/rwot5-boston/blob/master/topics-and-advance-readings/did-primer.md](https://github.com/WebOfTrustInfo/rwot5-boston/blob/master/topics-and-advance-readings/did-primer.md)
- **Self-Sovereign Identity (SSI) Book:** [https://www.manning.com/books/self-sovereign-identity](https://www.manning.com/books/self-sovereign-identity)

### Community and Support

- **W3C Credentials Community Group:** [https://www.w3.org/community/credentials/](https://www.w3.org/community/credentials/)
- **Decentralized Identity Foundation (DIF):** [https://identity.foundation/](https://identity.foundation/)
- **Veramo Discord:** [https://discord.gg/veramo](https://discord.gg/veramo)


## Development and Testing

### Running Tests

**Issuer Service Tests:**
```bash
cd issuer
npm test
```

**Client Tests:**
```bash
cd client
npm test
```

**Smart Contract Tests:**
```bash
cd blockchain
npx hardhat test
```

### CLI Testing Script

The issuer service includes a CLI script for testing credential issuance:

```bash
cd issuer
node scripts/issue-sample.js
```

This script:
- Calls the `/issue` endpoint with sample data
- Displays the returned VC in formatted JSON
- Useful for testing without the client UI

### Linting and Code Quality

**Run ESLint:**
```bash
# Client
cd client
npm run lint

# Issuer
cd issuer
npm run lint
```

### Building for Production

**Client:**
```bash
cd client
npm run build
# Output in client/dist/
```

**Issuer:**
```bash
cd issuer
# No build step needed for Node.js
```

## Security Considerations

### Current Security Limitations

This MVP has the following security limitations that must be addressed before production use:

1. **Unencrypted Private Keys:** Private keys are stored in browser localStorage without additional encryption
2. **No Authentication:** API endpoints have no authentication or authorization
3. **No Rate Limiting:** Endpoints are vulnerable to abuse and DoS attacks
4. **In-Memory Storage:** Issuer keys are lost on restart, breaking existing credentials
5. **No HTTPS:** Local development uses HTTP (production must use HTTPS)
6. **Weak Passphrase Requirements:** No enforcement of strong passphrases
7. **No Backup/Recovery:** Lost passphrases mean lost credentials permanently

### Security Best Practices for Production

1. **Always use HTTPS/TLS** for all communications
2. **Implement proper authentication** (OAuth 2.0, API keys)
3. **Use hardware security modules** for key storage
4. **Implement rate limiting** on all endpoints
5. **Validate and sanitize** all inputs
6. **Use environment variables** for secrets (never commit to git)
7. **Implement audit logging** for all sensitive operations
8. **Regular security audits** and penetration testing
9. **Keep dependencies updated** to patch vulnerabilities
10. **Implement proper error handling** (don't leak sensitive info)


## FAQ

### General Questions

**Q: What is a Decentralized Identifier (DID)?**

A: A DID is a new type of identifier that enables verifiable, self-sovereign digital identity. Unlike traditional identifiers (email, username), DIDs are:
- Created and controlled by the user
- Not dependent on any centralized authority
- Cryptographically verifiable
- Resolvable to DID documents containing public keys

**Q: What is a Verifiable Credential?**

A: A Verifiable Credential is a tamper-evident credential that has authorship that can be cryptographically verified. Think of it as a digital version of a physical credential (passport, driver's license, diploma) that can be verified without contacting the issuer.

**Q: Why use blockchain for credentials?**

A: Blockchain provides:
- Immutable audit trail of credential anchoring
- Decentralized revocation registry
- Timestamp proof for credential issuance
- No single point of failure

However, note that credentials themselves are NOT stored on-chain (privacy), only hashes or revocation status.

**Q: Can I use this in production?**

A: No, this is an MVP for demonstration and learning purposes. See the "Production Improvements" section for required enhancements before production use.

### Technical Questions

**Q: Why did:key instead of did:ethr?**

A: `did:key` is used in the MVP because:
- No external dependencies (no blockchain RPC needed)
- Instant DID creation (no transactions)
- Simple implementation for learning
- Self-contained (public key is in the DID itself)

Production systems should use `did:ethr` or `did:web` for better features.

**Q: How secure is the encrypted vault?**

A: The vault uses AES-GCM encryption with PBKDF2 key derivation, which is cryptographically secure. However:
- Keys are stored in localStorage (accessible to JavaScript)
- No protection against XSS attacks
- No hardware-backed security
- Production systems need HSM or secure enclave

**Q: What happens if I lose my passphrase?**

A: Your encrypted credentials cannot be recovered. This is by design (no backdoor), but production systems should implement recovery mechanisms like:
- Recovery codes
- Social recovery (trusted contacts)
- Multi-factor authentication

**Q: Can credentials be revoked?**

A: Yes, the issuer can add credential IDs to the revocation registry (`revoke.json`). Revoked credentials will fail verification. Production systems should use W3C Status List 2021 or blockchain-based revocation.

**Q: Why is R2 storage optional?**

A: The system can demonstrate credential issuance without file storage. R2 is only needed if you want to test the complete flow including encrypted file upload.

**Q: How do I reset everything?**

A: To start fresh:
1. Stop all services (Ctrl+C in all terminals)
2. Clear browser localStorage (DevTools → Application → Local Storage → Clear)
3. Delete `issuer/revoke.json` and recreate with `{"revokedCredentials": []}`
4. Restart Hardhat node (generates new blockchain state)
5. Redeploy contract and restart services


## Contributing

Contributions are welcome! This is an educational project demonstrating W3C standards implementation.

### Areas for Contribution

- Additional DID methods (did:ethr, did:web, did:ion)
- BBS+ signature implementation for selective disclosure
- Mobile wallet implementation
- Additional credential types and schemas
- Improved UI/UX
- Test coverage improvements
- Documentation enhancements

### Development Guidelines

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## License

MIT License

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Acknowledgments

- **W3C Credentials Community Group** - For developing the VC/VP standards
- **Veramo Team** - For the excellent credential framework
- **Hardhat Team** - For the Ethereum development environment
- **Cloudflare** - For R2 object storage

## Contact and Support

For questions, issues, or discussions:

- Open an issue on GitHub
- Join the W3C Credentials Community Group
- Check the Veramo Discord for technical questions

---

**Note:** This is a Minimum Viable Product (MVP) for demonstration and educational purposes. It is NOT production-ready. See the "Production Improvements" section for required enhancements before deploying to production environments.

**Built with ❤️ for the decentralized identity community**
