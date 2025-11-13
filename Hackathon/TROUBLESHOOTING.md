# 🔧 Troubleshooting Guide

Common issues and solutions for the Secure Document Workflow system.

## 🚀 Quick Fixes

### Issue: "MetaMask not installed"

**Symptom:** Error when trying to store hash on blockchain

**Solution:**
1. **Option A: Install MetaMask** (Recommended for full features)
   - Visit https://metamask.io/
   - Install browser extension
   - Create or import wallet
   - Refresh the page

2. **Option B: Skip Blockchain Step** (Testing only)
   - Click "Skip Blockchain (Complete Upload)" button
   - You can still upload and encrypt files
   - Blockchain anchoring can be done later

**Note:** You can upload and encrypt documents without MetaMask. Blockchain features are optional.

---

### Issue: "Lighthouse connection timeout"

**Symptom:** `ERR_CONNECTION_TIMED_OUT` when uploading

**Solution:** Mock storage is already enabled in your `.env`:
```bash
VITE_USE_MOCK_STORAGE=true
```

This uses localStorage instead of real IPFS. Perfect for testing!

**To use real Lighthouse later:**
1. Set `VITE_USE_MOCK_STORAGE=false`
2. Ensure you have a valid `VITE_LIGHTHOUSE_API_KEY`
3. Restart dev server

---

### Issue: "Backend connection refused"

**Symptom:** Cannot save metadata, API errors

**Solution:**
1. **Start the backend server:**
   ```bash
   cd backend
   npm install  # if not done yet
   npm run dev
   ```

2. **Verify it's running:**
   - Should see: `🚀 Backend server running on http://localhost:3001`
   - Check: http://localhost:3001/health

3. **Check .env configuration:**
   ```bash
   # client/.env
   VITE_BACKEND_URL=http://localhost:3001
   ```

---

### Issue: "Contract not deployed"

**Symptom:** Blockchain operations fail, no contract address

**Solution:**
1. **Start Hardhat node:**
   ```bash
   cd blockchain
   npx hardhat node
   ```
   Keep this running in a separate terminal.

2. **Deploy contract:**
   ```bash
   cd blockchain
   npm run deploy:document-hash
   ```

3. **Copy contract address** from output:
   ```
   ✅ DocumentHash deployed to: 0x5FbDB...
   ```

4. **Add to client/.env:**
   ```bash
   VITE_DOCUMENT_HASH_CONTRACT=0x5FbDB...
   ```

5. **Restart frontend:**
   ```bash
   cd client
   npm run dev
   ```

---

## 📋 Complete Workflow Issues

### Upload Works But Can't Store on Blockchain

**Checklist:**
- [ ] MetaMask installed?
- [ ] Hardhat node running?
- [ ] Contract deployed?
- [ ] Contract address in `.env`?
- [ ] MetaMask connected to correct network?

**MetaMask Network Setup:**
1. Open MetaMask
2. Click network dropdown
3. Add network manually:
   - **Network Name:** Hardhat Local
   - **RPC URL:** http://127.0.0.1:8545
   - **Chain ID:** 31337
   - **Currency:** ETH

---

### Can't Decrypt Files

**Possible Causes:**

1. **Wrong Password**
   - Decryption uses the same password as encryption
   - Passwords are case-sensitive
   - No password recovery possible

2. **File Not Found**
   - If using mock storage, check localStorage wasn't cleared
   - If using Lighthouse, check network connection

3. **Corrupted Data**
   - Re-upload the file
   - Check browser console for errors

---

### Files Not Showing in List

**Checklist:**
- [ ] Backend running?
- [ ] Metadata was saved during upload?
- [ ] Check browser console for errors
- [ ] Try refreshing the page

**Debug:**
```bash
# Check backend logs
cd backend
npm run dev

# Check if metadata exists
curl http://localhost:3001/api/metadata
```

---

## 🔍 Development Issues

### TypeScript Errors

**Solution:**
```bash
cd client
npm install
```

If errors persist:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

### Vite Build Errors

**Common fixes:**
```bash
# Clear Vite cache
rm -rf client/.vite

# Restart dev server
npm run dev
```

---

### Port Already in Use

**Symptom:** `EADDRINUSE: address already in use`

**Solution:**

**Windows:**
```bash
# Find process on port 5173 (client)
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Find process on port 3001 (backend)
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

**macOS/Linux:**
```bash
# Find and kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Find and kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

---

## 🌐 Network Issues

### CORS Errors

**Symptom:** `Access-Control-Allow-Origin` errors

**Solution:**
1. Check backend CORS configuration in `backend/.env`:
   ```bash
   CORS_ORIGIN=http://localhost:5173
   ```

2. Restart backend server

---

### Lighthouse Gateway Timeout

**Symptom:** Can't fetch files from IPFS

**Solution:**
1. **Use mock storage** (already enabled):
   ```bash
   VITE_USE_MOCK_STORAGE=true
   ```

2. **Or try different gateway:**
   - Edit `client/src/lib/lighthouse.ts`
   - Change gateway URL to:
     - `https://ipfs.io/ipfs/${cid}`
     - `https://cloudflare-ipfs.com/ipfs/${cid}`

---

## 🔐 Security Issues

### "Wallet connection rejected"

**Symptom:** MetaMask popup closed without connecting

**Solution:**
- Click "Store Hash on Blockchain" again
- Approve the connection in MetaMask
- Or click "Skip Blockchain" to complete without blockchain

---

### "Transaction rejected"

**Symptom:** MetaMask transaction cancelled

**Solution:**
- Try again
- Check you have enough ETH for gas
- On local network, use test accounts from Hardhat node

---

## 📱 Browser Issues

### Works in Chrome but not Firefox

**Solution:**
- Ensure MetaMask is installed in Firefox
- Check browser console for specific errors
- Try clearing browser cache

---

### LocalStorage Full

**Symptom:** `QuotaExceededError` when using mock storage

**Solution:**
```javascript
// Clear mock storage in browser console
for (let i = localStorage.length - 1; i >= 0; i--) {
  const key = localStorage.key(i);
  if (key?.startsWith('mock_ipfs_')) {
    localStorage.removeItem(key);
  }
}
```

---

## 🧪 Testing Issues

### Tests Failing

**Solution:**
```bash
cd client
npm test

# If errors persist
rm -rf node_modules
npm install
npm test
```

---

### Mock Storage Not Working

**Checklist:**
- [ ] `VITE_USE_MOCK_STORAGE=true` in `.env`?
- [ ] Dev server restarted after changing `.env`?
- [ ] Browser localStorage enabled?

---

## 🚨 Emergency Fixes

### Nothing Works

**Nuclear option - Fresh start:**

```bash
# Stop all servers (Ctrl+C in all terminals)

# Clean everything
cd client
rm -rf node_modules package-lock.json .vite
npm install

cd ../backend
rm -rf node_modules package-lock.json dist
npm install

cd ../blockchain
rm -rf node_modules package-lock.json artifacts cache
npm install

# Start fresh
# Terminal 1
cd blockchain && npx hardhat node

# Terminal 2
cd blockchain && npm run deploy:document-hash

# Terminal 3
cd backend && npm run dev

# Terminal 4
cd client && npm run dev
```

---

## 📞 Getting Help

### Check Logs

**Frontend (Browser Console):**
- Press F12
- Go to Console tab
- Look for errors (red text)

**Backend (Terminal):**
- Check terminal where backend is running
- Look for error messages

**Blockchain (Terminal):**
- Check terminal where Hardhat node is running
- Look for transaction errors

### Common Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| `MetaMask not installed` | No wallet extension | Install MetaMask or skip blockchain |
| `Failed to fetch` | Network/CORS issue | Check backend is running |
| `Contract not deployed` | No blockchain contract | Deploy contract |
| `Wrong password` | Decryption failed | Use correct password |
| `QuotaExceededError` | Storage full | Clear mock storage |
| `Connection timeout` | Lighthouse down | Use mock storage |

---

## ✅ Verification Checklist

Before asking for help, verify:

- [ ] All dependencies installed (`npm install` in each folder)
- [ ] All services running (blockchain, backend, frontend)
- [ ] Environment variables configured (`.env` files)
- [ ] Browser console checked for errors
- [ ] Correct network in MetaMask (if using blockchain)
- [ ] Contract deployed (if using blockchain)

---

## 📚 Additional Resources

- **QUICKSTART.md** - Setup guide
- **MOCK_STORAGE_GUIDE.md** - Mock storage details
- **STATUS.md** - Current implementation status
- **README.md** - Full documentation

---

**Last Updated:** November 13, 2025  
**Status:** Active troubleshooting guide
