# 🔐 Secure Document Workflow System

Complete end-to-end encrypted document management with blockchain anchoring.

## ✨ Features

- **Client-Side Encryption**: AES-256-GCM with PBKDF2 (200k iterations)
- **Decentralized Storage**: IPFS via Lighthouse.Storage
- **Blockchain Anchoring**: Immutable hash storage on Ethereum
- **Document Verification**: Verify authenticity against blockchain
- **Offline Mode**: Works without backend using localStorage
- **Zero-Knowledge**: Plaintext never leaves your browser

## 🚀 Quick Start (5 Minutes)

### 1. Install Dependencies

```bash
npm run setup
```

Or manually:
```bash
cd backend && npm install
cd ../blockchain && npm install
cd ../client && npm install
```

### 2. Configure Environment

```bash
# Client
cd client
cp .env.example .env
# Edit .env - already configured for offline mode!
```

### 3. Start Frontend (Offline Mode)

```bash
cd client
npm run dev
```

Open http://localhost:5173 - **That's it!** The system works offline.

### 4. Optional: Start Backend & Blockchain

Only needed for production features:

```bash
# Terminal 1: Blockchain
cd blockchain
npx hardhat node

# Terminal 2: Deploy Contract
cd blockchain
npx hardhat run scripts/deploy-document-hash.js --network localhost
# Copy contract address to client/.env

# Terminal 3: Backend
cd backend
npm run dev
```

## 📖 Usage

### Upload Document

1. Go to `/secure-upload`
2. Select file
3. Enter password
4. Click "Encrypt & Upload"
5. (Optional) Store hash on blockchain

### View Files

Go to `/secure-files` to see all uploaded documents

### Decrypt Document

1. Click "Decrypt" on any file
2. Enter password
3. Download decrypted file

### Verify Document

1. Go to `/secure-verify`
2. Upload original file
3. See verification results

## 🔧 Configuration

### Offline Mode (Default)

```bash
# client/.env
VITE_USE_MOCK_STORAGE=true  # Uses localStorage
VITE_BACKEND_URL=http://localhost:3001  # Optional
```

### Production Mode

```bash
# client/.env
VITE_USE_MOCK_STORAGE=false  # Uses real IPFS
VITE_LIGHTHOUSE_API_KEY=your_key_here
VITE_DOCUMENT_HASH_CONTRACT=0x...
```

Get Lighthouse API key: https://files.lighthouse.storage/

## 📁 Project Structure

```
/
├── backend/          # Express + TypeScript API
├── blockchain/       # Hardhat + Solidity contracts
├── client/          # React + TypeScript frontend
├── issuer/          # Existing DID issuer (preserved)
├── README.md        # This file
├── QUICKSTART.md    # Detailed setup guide
└── TROUBLESHOOTING.md  # Common issues & solutions
```

## 🔐 Security

### Encryption

- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key Derivation**: PBKDF2-SHA256, 200,000 iterations
- **Random Salt**: 16 bytes per file
- **Random IV**: 12 bytes per file

### Storage

- **Mock Mode**: localStorage (testing only)
- **Production**: IPFS via Lighthouse (permanent, decentralized)

### Blockchain

- **Hash Storage**: SHA-256 of original file
- **Timestamp**: Immutable proof of existence
- **Gas Optimized**: keccak256 mapping

## ⚠️ Important Notes

### Password Management

- **No recovery possible** if password is lost
- Use strong passwords (12+ characters)
- Store passwords securely

### Mock Storage Limits

- localStorage: 5-10MB total
- Use files < 100KB for testing
- Clear storage regularly

### Production Deployment

- Use real Lighthouse (disable mock storage)
- Deploy backend with Firestore
- Deploy contract to testnet/mainnet
- Enable HTTPS
- Implement rate limiting

## 🐛 Troubleshooting

### Storage Full

**Error**: `QuotaExceededError`

**Solution**:
1. Go to `/secure-files`
2. Click "Clear Storage" button
3. Or use smaller files (< 100KB)

### Backend Not Running

**Error**: `ERR_CONNECTION_REFUSED`

**Solution**: System works offline! Metadata saves to localStorage automatically.

To start backend:
```bash
cd backend
npm run dev
```

### MetaMask Not Installed

**Error**: `MetaMask not installed`

**Solution**: Blockchain features are optional. Click "Skip Blockchain" to complete upload.

To enable blockchain:
1. Install MetaMask: https://metamask.io/
2. Refresh page
3. Connect wallet

### More Issues?

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed solutions.

## 📚 Documentation

- **README.md** (this file) - Overview and quick start
- **QUICKSTART.md** - Detailed step-by-step setup
- **TROUBLESHOOTING.md** - Solutions to common issues

## 🎯 Use Cases

- **Legal Documents**: Contracts, agreements
- **Medical Records**: Patient data, prescriptions
- **Academic Credentials**: Diplomas, certificates
- **Identity Documents**: Passports, licenses
- **Any Sensitive Files**: Encrypted and verifiable

## 🔄 Workflow

```
1. Select File → 2. Encrypt (AES-256) → 3. Upload (IPFS)
                                              ↓
4. Verify ← 5. Decrypt ← 6. Store Hash (Blockchain)
```

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS
- **Backend**: Express, TypeScript, Firestore
- **Blockchain**: Solidity 0.8.20, Hardhat, Ethers.js
- **Storage**: Lighthouse.Storage (IPFS)
- **Crypto**: Web Crypto API

## 📊 API Endpoints

### Backend

- `POST /api/metadata` - Create document metadata
- `GET /api/metadata` - List documents
- `GET /api/metadata/:id` - Get by ID
- `GET /api/metadata/byHash/:sha256` - Get by hash
- `PATCH /api/metadata/updateTx` - Update transaction hash

### Smart Contract

- `storeHash(string hash)` - Store SHA-256 on blockchain
- `checkHash(string hash)` - Verify hash exists
- `getHashTimestamp(string hash)` - Get storage timestamp

## 🤝 Integration

This system coexists with your existing DID credential vault:

- **Existing**: `/upload`, `/vault`, `/verify` (credentials)
- **New**: `/secure-upload`, `/secure-files`, `/secure-verify` (documents)

Both systems work independently without conflicts.

## 📝 License

MIT

## 🙏 Acknowledgments

- Lighthouse.Storage for IPFS integration
- Hardhat for Ethereum development
- Web Crypto API for client-side encryption

---

**Status**: ✅ Fully functional in offline mode  
**Backend Required**: No (optional)  
**MetaMask Required**: No (optional for blockchain)  
**Ready to Use**: Yes!
