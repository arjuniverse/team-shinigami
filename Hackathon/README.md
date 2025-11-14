# 🔐 Secure Document Workflow with DID-Auth

A full-stack secure document management system with client-side encryption, decentralized storage (IPFS), blockchain verification, and DID-based authentication.

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- MetaMask browser extension

### Installation

```bash
# Install all dependencies
npm install

# Or install individually
cd backend && npm install
cd ../blockchain && npm install
cd ../client && npm install
cd ../issuer && npm install
```

### Setup

1. **Configure Backend**
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
```

2. **Configure Client**
```bash
cd client
cp .env.example .env
# Edit .env with your configuration
```

3. **Generate Issuer Keys**
```bash
cd issuer
npm run generate-key
cp .env.generated .env
```

### Run

**Terminal 1 - Blockchain:**
```bash
cd blockchain
npx hardhat node
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 3 - Issuer:**
```bash
cd issuer
npm run dev
```

**Terminal 4 - Client:**
```bash
cd client
npm run dev
```

Open http://localhost:5173

## 📚 Features

### Document Management
- **Client-side Encryption**: AES-256-GCM encryption before upload
- **Decentralized Storage**: IPFS via Lighthouse
- **Blockchain Anchoring**: Immutable proof on Ethereum
- **Verification**: Verify document authenticity
- **Secure Decryption**: Password-based decryption

### DID & Verifiable Credentials
- **DID:PKH**: Decentralized identifiers from Ethereum addresses
- **DID-Auth**: Challenge-response authentication via MetaMask
- **JWT-VC**: W3C compliant verifiable credentials
- **Session Management**: Secure token-based sessions

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                  CLIENT (React)                      │
│  DID Auth → Encrypt → IPFS → Blockchain Anchor     │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│              ISSUER (Express)                        │
│  DID-Auth Challenge → JWT-VC Issuance              │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│              BACKEND (Express)                       │
│  Metadata Management → Firestore/JSON              │
└─────────────────────────────────────────────────────┘
```

## 🔒 Security

- **Zero-Knowledge**: Server never sees plaintext
- **Client-Side Encryption**: AES-256-GCM
- **Strong Key Derivation**: PBKDF2-SHA256 (200k iterations)
- **DID-Based Auth**: Cryptographic proof of identity
- **Session Tokens**: Short-lived (10 min expiry)
- **Challenge-Response**: Prevents replay attacks

## 📖 Documentation

- **QUICKSTART.md** - Detailed setup guide
- **METAMASK_SETUP_GUIDE.md** - MetaMask configuration
- **QUICKSTART_ISSUER.md** - Issuer service setup
- **PROJECT_OVERVIEW.md** - Complete system overview
- **TROUBLESHOOTING.md** - Common issues and solutions
- **issuer/README.md** - Issuer API documentation

## 🧪 Testing

```bash
# Run issuer tests
cd issuer
npm test

# Run with coverage
npm test -- --coverage
```

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS
- **Backend**: Express, TypeScript, Firestore
- **Issuer**: Express, TypeScript, JWT
- **Blockchain**: Solidity, Hardhat, Ethers.js
- **Storage**: IPFS (Lighthouse)
- **Crypto**: Web Crypto API, AES-256-GCM
- **DID**: did:pkh, W3C DIDs
- **VC**: JWT-VC, W3C Verifiable Credentials

## 📦 Project Structure

```
├── backend/          # Express API server
├── blockchain/       # Hardhat + Solidity contracts
├── client/           # React frontend
└── issuer/           # DID-Auth & JWT-VC service
```

## 🚀 Deployment

### Development
- Frontend: Vite dev server (localhost:5173)
- Backend: Express (localhost:3001)
- Issuer: Express (localhost:8080)
- Blockchain: Hardhat local (localhost:8545)

### Production
- Frontend: Vercel/Netlify
- Backend: Railway/Heroku/AWS
- Issuer: Same or separate instance
- Blockchain: Ethereum mainnet/testnet
- Storage: Lighthouse (IPFS)
- Database: Firestore

## 🔑 Environment Variables

### Backend (.env)
```
PORT=3001
NODE_ENV=development
FIREBASE_PROJECT_ID=your-project-id
# ... see .env.example
```

### Client (.env)
```
VITE_BACKEND_URL=http://localhost:3001
VITE_LIGHTHOUSE_API_KEY=your-api-key
# ... see .env.example
```

### Issuer (.env)
```
ISSUER_PRIVATE_KEY=0x...
ISSUER_DID=did:pkh:eip155:1:0x...
SESSION_SECRET=your-secret
PORT=8080
```

## 📝 API Endpoints

### Issuer
- `GET /issuer/challenge?did=<did>` - Get challenge
- `POST /issuer/verify-challenge` - Verify signature
- `POST /issuer/issue-vc` - Issue credential
- `GET /issuer/verify-vc?jwt=<jwt>` - Verify credential

### Backend
- `POST /api/metadata` - Create metadata
- `GET /api/metadata` - List documents
- `GET /api/metadata/:id` - Get document
- `GET /api/metadata/byHash/:sha256` - Find by hash

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT

## 🙏 Acknowledgments

- W3C for DID and VC specifications
- Lighthouse for IPFS storage
- MetaMask for wallet integration
- Hardhat for Ethereum development

---

**Built with** ❤️ **using React, TypeScript, Solidity, and Web3 technologies**
