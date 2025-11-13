# Requirements Document

## Introduction

This document specifies the requirements for a Decentralized Identity (DID) and Credential Vault MVP. The system enables users to create decentralized identifiers, upload encrypted files to Cloudflare R2 storage, request verifiable credentials from an issuer, store credentials securely in a browser-based vault, create verifiable presentations, and verify credentials. The MVP consists of three main components: a React frontend (Holder/Verifier UI), a Node.js backend (Issuer service), and a Hardhat blockchain environment for credential anchoring.

## Glossary

- **DID System**: The complete decentralized identity and credential vault application
- **Holder UI**: The React-based frontend application where users manage their credentials
- **Issuer Service**: The Node.js backend service that issues and verifies credentials
- **Blockchain Module**: The Hardhat-based local blockchain environment with anchor contract
- **VC**: Verifiable Credential - a tamper-evident credential with cryptographic proof
- **VP**: Verifiable Presentation - a package of one or more VCs presented for verification
- **R2 Storage**: Cloudflare R2 object storage service for encrypted document storage
- **Veramo Agent**: The credential management library used by the Issuer Service
- **Anchor Contract**: Smart contract that stores credential hashes on blockchain
- **Vault**: Browser-based encrypted storage for verifiable credentials

## Requirements

### Requirement 1

**User Story:** As a credential holder, I want to upload encrypted files to Cloudflare R2 storage and receive a storage key, so that I can prove ownership of documents while maintaining privacy.

#### Acceptance Criteria

1. WHEN the Holder UI receives a file upload request, THE Holder UI SHALL encrypt the file using AES-GCM encryption before upload
2. WHEN the file is encrypted, THE Holder UI SHALL transmit the encrypted file to Cloudflare R2 via the Issuer Service
3. WHEN R2 Storage successfully stores the file, THE Holder UI SHALL display the returned storage key or object identifier
4. THE Holder UI SHALL display a confirmation message with the storage location reference
5. WHEN the file upload fails, THE Holder UI SHALL display an error message with the failure reason

### Requirement 2

**User Story:** As a credential holder, I want to create a decentralized identifier in my browser, so that I can have a self-sovereign identity without relying on centralized authorities.

#### Acceptance Criteria

1. THE Holder UI SHALL generate a did:key identifier using client-side cryptographic libraries
2. WHEN DID generation completes, THE Holder UI SHALL display the complete DID string to the user
3. THE Holder UI SHALL store the DID and associated private key material in browser storage
4. THE Holder UI SHALL generate the DID without requiring external network calls

### Requirement 3

**User Story:** As a credential holder, I want to request a verifiable credential from an issuer by providing my DID and file claims, so that I can obtain a cryptographically signed proof of my document ownership.

#### Acceptance Criteria

1. WHEN the user clicks "Request Credential", THE Holder UI SHALL send a POST request to the Issuer Service /issue endpoint with subjectDid and claims data
2. THE Issuer Service SHALL accept JSON payload containing subjectDid and claims fields
3. WHEN the Issuer Service receives a valid request, THE Issuer Service SHALL create a W3C-compliant Verifiable Credential using the Veramo Agent
4. THE Issuer Service SHALL sign the Verifiable Credential with the issuer's private key
5. WHEN credential creation succeeds, THE Issuer Service SHALL return the signed VC in JSON format with HTTP status 200

### Requirement 4

**User Story:** As a credential holder, I want to store my verifiable credentials in an encrypted vault, so that my credentials remain secure and private on my device.

#### Acceptance Criteria

1. WHEN the Holder UI receives a VC from the Issuer Service, THE Holder UI SHALL prompt the user for a passphrase
2. THE Holder UI SHALL derive an AES-GCM encryption key from the passphrase using WebCrypto API
3. THE Holder UI SHALL encrypt the VC using AES-GCM encryption before storage
4. THE Holder UI SHALL store the encrypted VC in browser localStorage
5. WHEN the user requests to view stored credentials, THE Holder UI SHALL decrypt the VCs using the provided passphrase

### Requirement 5

**User Story:** As a credential holder, I want to create a verifiable presentation from my stored credentials, so that I can selectively share my credentials with verifiers.

#### Acceptance Criteria

1. THE Holder UI SHALL display a list of all stored VCs in the vault
2. WHEN the user selects one or more VCs, THE Holder UI SHALL create a W3C-compliant Verifiable Presentation
3. THE Holder UI SHALL sign the VP with the holder's DID private key
4. THE Holder UI SHALL include the selected VCs in the VP's verifiableCredential array
5. WHEN VP creation completes, THE Holder UI SHALL display the VP JSON structure

### Requirement 6

**User Story:** As a verifier, I want to submit a verifiable presentation to the issuer for verification, so that I can confirm the authenticity and validity of presented credentials.

#### Acceptance Criteria

1. THE Holder UI SHALL provide a Verifier component that accepts VP input
2. WHEN the user submits a VP, THE Holder UI SHALL send a POST request to the Issuer Service /verify endpoint
3. THE Issuer Service SHALL verify the VP's cryptographic proofs using the Veramo Agent
4. THE Issuer Service SHALL check the revocation status of all VCs in the VP against revoke.json
5. WHEN verification completes, THE Issuer Service SHALL return a JSON response with verified boolean and reason string
6. THE Holder UI SHALL display the verification result showing verified status and reason

### Requirement 7

**User Story:** As an issuer, I want to manage a simple revocation registry, so that I can invalidate credentials when necessary.

#### Acceptance Criteria

1. THE Issuer Service SHALL maintain a revoke.json file containing revoked credential identifiers
2. WHEN verifying a VP, THE Issuer Service SHALL check each VC's ID against the revocation registry
3. IF a VC is found in the revocation registry, THEN THE Issuer Service SHALL return verified: false with reason "credential revoked"
4. THE revoke.json file SHALL be readable and writable by the Issuer Service process

### Requirement 8

**User Story:** As a developer, I want to anchor credential hashes on a local blockchain, so that I can demonstrate blockchain-based credential verification in the MVP.

#### Acceptance Criteria

1. THE Blockchain Module SHALL include an Anchor.sol smart contract with an anchor function
2. THE Anchor contract SHALL accept a bytes32 hash parameter and store it in a mapping
3. WHEN the anchor function executes successfully, THE Anchor contract SHALL emit an event with the hash
4. THE Issuer Service SHALL provide a POST /anchor endpoint that accepts dataHash
5. WHEN the /anchor endpoint receives a request, THE Issuer Service SHALL submit a transaction to the Anchor contract using ethers.js
6. THE /anchor endpoint SHALL return the transaction hash upon successful submission

### Requirement 9

**User Story:** As a developer, I want the Veramo agent to use did:key provider with in-memory key storage, so that I can run the MVP without external dependencies or blockchain RPC endpoints.

#### Acceptance Criteria

1. THE Veramo Agent SHALL configure a KeyManager with in-memory key store
2. THE Veramo Agent SHALL configure a DIDManager with did:key provider
3. THE Veramo Agent SHALL include the W3C Credential plugin for VC creation and verification
4. THE Veramo Agent SHALL initialize without requiring external blockchain RPC URLs
5. THE Veramo Agent SHALL persist keys only in memory during the process lifetime

### Requirement 10

**User Story:** As a developer, I want clear npm scripts and documentation, so that I can quickly set up and run the complete system locally.

#### Acceptance Criteria

1. THE client package.json SHALL include a "dev" script that starts Vite on port 5173
2. THE issuer package.json SHALL include a "start" script that runs the Express server on port 8080
3. THE blockchain package.json SHALL include scripts to run Hardhat node and deploy contracts
4. THE DID System SHALL include a README.md with step-by-step setup instructions
5. THE README.md SHALL document the complete demo flow from upload to verification
6. THE DID System SHALL include .env.example files in each subfolder showing required environment variables
7. THE DID System SHALL include a .gitignore file that excludes node_modules, .env files, and build artifacts

### Requirement 11

**User Story:** As a developer, I want clear code comments indicating production improvements, so that I understand what needs to be enhanced before deploying to production.

#### Acceptance Criteria

1. THE DID System SHALL include TODO comments for secure key storage improvements
2. THE DID System SHALL include comments noting where did:ethr or other production DID methods should replace did:key
3. THE DID System SHALL include comments indicating where BBS+ signatures could enable selective disclosure
4. THE DID System SHALL include comments noting where persistent database should replace in-memory and file-based storage
5. THE code SHALL remain concise and copy-paste runnable despite the TODO comments
