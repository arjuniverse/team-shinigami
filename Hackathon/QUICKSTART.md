# 🚀 Quick Start Guide

Get the secure document workflow system running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- MetaMask browser extension
- Terminal/command line access

## Step 1: Clone and Install (2 minutes)

```bash
# Navigate to your project root
cd your-project-folder

# Install backend dependencies
cd backend
npm install

# Install blockchain dependencies
cd ../blockchain
npm install

# Install client dependencies
cd ../client
npm install
```

## Step 2: Configure Environment (1 minute)

### Backend Configuration

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```bash
PORT=3001
STORAGE_MODE=json
CORS_ORIGIN=http://localhost:5173
```

### Client Configuration

```bash
cd ../client
cp .env.example .env
```

Edit `client/.env`:
```bash
VITE_BACKEND_URL=http://localhost:3001
VITE_LIGHTHOUSE_API_KEY=your_key_here
# Contract address will be added after deployment
```

**Get Lighthouse API Key:**
1. Visit https://files.lighthouse.storage/
2. Sign up for free account
3. Copy API key
4. Paste into `VITE_LIGHTHOUSE_API_KEY`

## Step 3: Start Services (2 minutes)

Open **4 terminal windows**:

### Terminal 1: Blockchain Node
```bash
cd blockchain
npx hardhat node
```
Keep this running. You'll see test accounts with ETH.

### Terminal 2: Deploy Contract
```bash
cd blockchain
npx hardhat run scripts/deploy-document-hash.js --network localhost
```

Copy the contract address from output, e.g.:
```
✅ DocumentHash deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

Add to `client/.env`:
```bash
VITE_DOCUMENT_HASH_CONTRACT=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### Terminal 3: Backend Server
```bash
cd backend
npm run dev
```

You should see:
```
🚀 Backend server running on http://localhost:3001
📦 Using JSON file storage (development mode)
```

### Terminal 4: Frontend
```bash
cd client
npm run dev
```

You should see:
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:5173/
```

## Step 4: Configure MetaMask (30 seconds)

1. Open MetaMask
2. Click network dropdown → "Add Network" → "Add a network manually"
3. Enter:
   - **Network Name:** Hardhat Local
   - **RPC URL:** http://127.0.0.1:8545
   - **Chain ID:** 31337
   - **Currency Symbol:** ETH
4. Click "Save"

5. Import test account:
   - Copy private key from Terminal 1 (Hardhat node output)
   - MetaMask → Account menu → "Import Account"
   - Paste private key
   - You should see 10000 ETH

## Step 5: Test the System (1 minute)

1. **Open browser:** http://localhost:5173/secure-upload

2. **Upload a document:**
   - Click "Select File"
   - Choose any file (PDF, image, etc.)
   - Wait for SHA-256 hash to compute
   - Enter a password (e.g., "TestPassword123!")
   - Click "Encrypt & Upload"
   - Wait for upload to complete

3. **Store on blockchain:**
   - Click "Store Hash on Blockchain"
   - MetaMask will pop up
   - Click "Confirm"
   - Wait for transaction confirmation

4. **View your files:**
   - Navigate to http://localhost:5173/secure-files
   - You should see your uploaded document

5. **Verify document:**
   - Navigate to http://localhost:5173/secure-verify
   - Upload the same file again
   - Click "Verify Document"
   - You should see ✅ matches for both backend and blockchain

## 🎉 Success!

You now have a fully functional secure document workflow system running locally.

## Next Steps

### Try Decryption

1. Go to http://localhost:5173/secure-files
2. Click "Decrypt" on your document
3. Enter the same password you used for encryption
4. Click "Decrypt File"
5. Download the decrypted file

### Upload More Documents

- Try different file types
- Use different passwords
- Test with larger files

### Explore the Code

- Check `client/src/lib/crypto.ts` for encryption logic
- Review `blockchain/contracts/DocumentHash.sol` for smart contract
- Examine `backend/src/routes/metadata.ts` for API endpoints

## 🐛 Troubleshooting

### "MetaMask not installed"
- Install MetaMask extension from https://metamask.io/

### "Failed to upload to Lighthouse"
- Check your API key in `client/.env`
- Verify internet connection
- Try a smaller file first

### "Contract not deployed"
- Make sure Hardhat node is running (Terminal 1)
- Re-run deployment script (Terminal 2)
- Update contract address in `client/.env`

### "Backend connection refused"
- Check backend is running (Terminal 3)
- Verify `VITE_BACKEND_URL` in `client/.env`
- Check port 3001 is not in use

### "Transaction failed"
- Make sure you're on Hardhat Local network in MetaMask
- Check you have ETH in your account
- Try refreshing the page

## 📚 Learn More

- **Full Documentation:** See `README.md`
- **API Examples:** See `EXAMPLES.md`
- **Deployment Guide:** See `DEPLOYMENT.md`
- **Migration Guide:** See `MIGRATION.md`

## 🔒 Security Reminder

This is a **development setup**. For production:
- Use server-side Lighthouse uploads
- Deploy contracts to testnet/mainnet
- Use Firestore instead of JSON storage
- Enable HTTPS
- Implement rate limiting
- Review security best practices in `DEPLOYMENT.md`

## 💡 Tips

- **Password:** Use a strong password and remember it! There's no recovery.
- **Test Files:** Start with small files (< 1MB) for faster testing
- **Browser Console:** Open DevTools (F12) to see detailed logs
- **Network Tab:** Monitor API calls and blockchain transactions

## 🎯 What You've Built

✅ Client-side AES-256-GCM encryption  
✅ PBKDF2 key derivation (200k iterations)  
✅ Decentralized IPFS storage via Lighthouse  
✅ Blockchain hash anchoring  
✅ Metadata management API  
✅ Document verification system  
✅ Complete end-to-end encrypted workflow  

Congratulations! 🎊
