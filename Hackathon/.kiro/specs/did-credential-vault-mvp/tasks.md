# Implementation Plan

- [x] 1. Set up project structure and configuration files




  - Create root directory with three subfolders: client, issuer, blockchain
  - Create .gitignore file excluding node_modules, .env, build artifacts
  - Create root README.md with setup instructions and demo flow
  - _Requirements: 10.4, 10.5, 10.7_

- [x] 2. Initialize blockchain module with Hardhat





  - Create blockchain/package.json with Hardhat dependencies
  - Create hardhat.config.js for local network configuration
  - Write Anchor.sol contract with anchor function, mapping, and event
  - Create deployment script that saves contract address to JSON file
  - Add npm scripts for running node and deploying contracts
  - Create blockchain/.env.example file
  - _Requirements: 8.1, 8.2, 8.3, 10.3_

- [x] 3. Set up issuer service foundation





  - Create issuer/package.json with Express, Veramo, and AWS SDK dependencies
  - Create Express server in index.js with CORS and JSON middleware
  - Set up basic error handling middleware
  - Create issuer/.env.example with R2 and blockchain configuration
  - Add npm start script to run server on port 8080
  - _Requirements: 10.2, 10.6_

- [x] 4. Implement Veramo agent configuration




  - Create veramo-agent.js with KeyManager and MemoryKeyStore
  - Configure DIDManager with KeyDIDProvider for did:key
  - Add CredentialPlugin for W3C VC creation and verification
  - Create issuer DID on agent initialization
  - Export configured agent instance
  - Add TODO comments for production DID methods (did:ethr)
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 11.2_

- [x] 5. Implement R2 file upload endpoint





  - Configure S3Client with R2 endpoint and credentials
  - Create POST /upload endpoint accepting multipart form data
  - Implement file upload to R2 bucket using PutObjectCommand
  - Return storage key and metadata on success
  - Add error handling for R2 failures
  - Add TODO comments for production improvements (pre-signed URLs)
  - _Requirements: 1.2, 1.3, 1.5, 11.4_

- [x] 6. Implement credential issuance endpoint




  - Create POST /issue endpoint accepting subjectDid and claims
  - Validate request payload structure
  - Use Veramo agent to create W3C-compliant VC with claims
  - Sign VC with issuer's DID using JWT proof format
  - Return signed VC with HTTP 200 on success
  - Add error handling for invalid DID format and Veramo errors
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 7. Implement revocation registry and verification endpoint





  - Create revoke.json file with empty revokedCredentials array
  - Create POST /verify endpoint accepting VP
  - Use Veramo agent to verify VP cryptographic proofs
  - Check each VC ID against revocation registry
  - Return verification result with verified boolean and reason string
  - Add error handling for invalid VP format and verification failures
  - _Requirements: 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4_

- [x] 8. Implement blockchain anchoring endpoint




  - Create POST /anchor endpoint accepting dataHash
  - Load deployed contract address from JSON file
  - Use ethers.js to submit transaction to Anchor contract
  - Return transaction hash and block number on success
  - Add error handling for network unavailable and transaction failures
  - _Requirements: 8.4, 8.5, 8.6_

- [x] 9. Create issuer CLI testing script




  - Create scripts/issue-sample.js that calls /issue endpoint
  - Include sample DID and claims data
  - Display returned VC in formatted JSON
  - Add usage instructions in comments
  - _Requirements: 10.5_

- [x] 10. Initialize client application with Vite and React




  - Create client/package.json with React, Vite, and crypto dependencies
  - Create vite.config.js with port 5173 configuration
  - Create index.html with root div
  - Create src/main.jsx with React root rendering
  - Create src/App.jsx with basic routing structure
  - Add npm dev script to start Vite server
  - Create client/.env.example with VITE_ISSUER_API_URL
  - _Requirements: 10.1, 10.6_

- [x] 11. Implement browser-based DID generation utility





  - Create src/utils/didManager.js
  - Implement generateDidKey function using @veramo/did-provider-key
  - Implement storeDid function saving to localStorage
  - Implement retrieveDid function loading from localStorage
  - Implement signPresentation function for VP signing
  - Add error handling for crypto API unavailability
  - Add TODO comments for secure key storage improvements
  - _Requirements: 2.1, 2.3, 2.4, 11.1_

- [x] 12. Implement file encryption and R2 upload utility





  - Create src/utils/r2Upload.js
  - Implement encryptFile function using WebCrypto AES-GCM
  - Implement uploadToR2 function calling issuer /upload endpoint
  - Implement buildClaimsFromUpload function creating claims object
  - Add error handling for encryption and network failures
  - _Requirements: 1.1, 1.2_

- [x] 13. Implement encrypted vault utility




  - Create src/utils/cryptoVault.js
  - Implement deriveKey function using PBKDF2 with salt
  - Implement encryptVC function using AES-GCM encryption
  - Implement decryptVC function with passphrase verification
  - Implement storeVC function saving to localStorage
  - Implement retrieveVCs function loading and decrypting all VCs
  - Add error handling for wrong passphrase and corrupted data
  - Add TODO comments for passphrase strength requirements
  - _Requirements: 4.2, 4.3, 4.4, 4.5, 11.1_

- [x] 14. Create UploadAndCreateDid component




  - Create src/components/UploadAndCreateDid.jsx
  - Add file input and upload button
  - Implement file encryption and upload to R2
  - Display storage key and confirmation message
  - Add button to generate DID and display DID string
  - Add button to request VC from issuer with storage key claims
  - Prompt for vault passphrase and store received VC
  - Display success/error messages for each operation
  - _Requirements: 1.3, 1.4, 1.5, 2.2, 3.1, 4.1_

- [x] 15. Create Vault component for credential management




  - Create src/components/Vault.jsx
  - Prompt for passphrase to unlock vault
  - Display list of all stored VCs with details
  - Add checkboxes for selecting VCs
  - Add button to create VP from selected VCs
  - Implement VP creation with holder's DID signature
  - Display created VP JSON structure
  - Add copy-to-clipboard functionality for VP
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 16. Create Verifier component for VP verification




  - Create src/components/Verifier.jsx
  - Add textarea for pasting VP JSON
  - Add file upload option for VP JSON file
  - Add verify button that calls issuer /verify endpoint
  - Display verification result with verified status and reason
  - Show detailed error messages for verification failures
  - Add visual indicators for verified/failed status
  - _Requirements: 6.1, 6.2, 6.6_

- [x] 17. Wire up App component with navigation





  - Update src/App.jsx with tab navigation or simple sections
  - Include UploadAndCreateDid, Vault, and Verifier components
  - Add minimal styling for usability
  - Add application title and instructions
  - _Requirements: 10.5_

- [x] 18. Create comprehensive README documentation




  - Document prerequisites (Node.js, npm)
  - Add step-by-step setup instructions for all three components
  - Document environment variable configuration
  - Provide complete demo flow walkthrough
  - Add troubleshooting section
  - Include architecture diagram reference
  - Add links to W3C VC/VP specifications
  - Document production improvement areas
  - _Requirements: 10.4, 10.5, 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 19. Add production improvement comments throughout codebase
  - Add TODO comments for secure key storage in client utilities
  - Add comments for did:ethr migration in Veramo agent
  - Add comments for BBS+ selective disclosure in VP creation
  - Add comments for persistent database in issuer service
  - Add comments for proper revocation registry implementation
  - Ensure code remains concise and runnable despite comments
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
