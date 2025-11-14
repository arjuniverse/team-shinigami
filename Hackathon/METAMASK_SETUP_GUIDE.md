# 🦊 MetaMask Setup Guide

Complete guide to installing and configuring MetaMask for your DID-Auth system.

---

## 📥 Step 1: Install MetaMask

### Option A: Chrome/Brave/Edge
1. Open your browser
2. Go to: https://metamask.io/download/
3. Click **"Install MetaMask for Chrome"** (or your browser)
4. Click **"Add to Chrome"** in the extension store
5. Click **"Add Extension"** when prompted

### Option B: Firefox
1. Go to: https://metamask.io/download/
2. Click **"Install MetaMask for Firefox"**
3. Click **"Add to Firefox"**
4. Click **"Add"** when prompted

### Verify Installation
- Look for the fox icon 🦊 in your browser toolbar
- If you don't see it, click the puzzle piece icon and pin MetaMask

---

## 🔐 Step 2: Create Your Wallet

### First Time Setup

1. **Click the MetaMask icon** 🦊 in your toolbar

2. **Click "Get Started"**

3. **Choose "Create a new wallet"**

4. **Agree to terms** (read them if you want)

5. **Create a password**
   - Use a strong password (12+ characters)
   - This password unlocks MetaMask on THIS device only
   - Write it down somewhere safe
   - Click "Create a new wallet"

6. **Secure Your Wallet** (IMPORTANT!)
   - Click "Secure my wallet (recommended)"
   - You'll see your **Secret Recovery Phrase** (12 words)
   
   ⚠️ **CRITICAL**: 
   - Write these 12 words down on paper
   - Store them in a safe place
   - NEVER share them with anyone
   - NEVER enter them on any website
   - These words can recover your wallet on any device
   - If you lose them, you lose access to your funds FOREVER

7. **Confirm Your Secret Recovery Phrase**
   - Click the words in the correct order
   - This proves you wrote them down

8. **Done!** 
   - Click "Got it!"
   - Your wallet is created! 🎉

---

## 🌐 Step 3: Add Hardhat Local Network

For development, you'll use Hardhat's local blockchain.

### Add Network Manually

1. **Open MetaMask** (click the fox icon)

2. **Click the network dropdown** at the top
   - It probably says "Ethereum Mainnet"

3. **Click "Add network"** at the bottom

4. **Click "Add a network manually"** at the bottom

5. **Enter these details:**

   ```
   Network Name: Hardhat Local
   New RPC URL: http://127.0.0.1:8545
   Chain ID: 31337
   Currency Symbol: ETH
   Block Explorer URL: (leave blank)
   ```

6. **Click "Save"**

7. **Switch to Hardhat Local**
   - Click the network dropdown again
   - Select "Hardhat Local"

---

## 💰 Step 4: Import Hardhat Test Account

Hardhat provides test accounts with ETH for development.

### Import Account #1 (Recommended)

1. **Open MetaMask**

2. **Click the account icon** (circle) in the top right

3. **Click "Add account or hardware wallet"**

4. **Click "Import account"**

5. **Paste this private key:**
   ```
   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```

6. **Click "Import"**

7. **Rename the account** (optional but recommended):
   - Click the three dots next to the account
   - Click "Account details"
   - Click the pencil icon next to the name
   - Rename to "Hardhat Test #1"
   - Click the checkmark

### Account Details

After importing, you'll have:
- **Address**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- **Balance**: 10,000 ETH (test ETH, not real)
- **DID**: `did:pkh:eip155:31337:0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266`

⚠️ **Note**: This is a PUBLIC test account. NEVER use it on mainnet or with real funds!

---

## 🧪 Step 5: Start Hardhat Node

Before using MetaMask with your app, start the Hardhat blockchain:

### Terminal 1: Start Hardhat
```bash
cd blockchain
npx hardhat node
```

**Expected output:**
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
...
```

**Keep this terminal running!**

---

## ✅ Step 6: Test MetaMask Connection

### Test in Browser Console

1. **Open your browser** (Chrome/Firefox/etc.)

2. **Press F12** to open Developer Tools

3. **Go to Console tab**

4. **Type this command:**
   ```javascript
   window.ethereum
   ```

5. **Press Enter**

**Expected result:**
- You should see an object with properties like `isMetaMask: true`
- If you see `undefined`, MetaMask is not installed correctly

### Test Connection

In the console, type:
```javascript
ethereum.request({ method: 'eth_requestAccounts' })
```

**Expected result:**
- MetaMask popup appears asking to connect
- Click "Next" then "Connect"
- Console shows: `['0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266']`

---

## 🚀 Step 7: Test with Your App

Now test with your actual application!

### Start Your Client

```bash
cd client
npm run dev
```

### Open the App

1. **Open browser**: http://localhost:5173

2. **Navigate to DID Panel**: http://localhost:5173/did

3. **Click "Connect Wallet & Show DID"**

4. **MetaMask popup appears**:
   - Click "Next"
   - Click "Connect"

5. **Your DID appears!**
   - Should show: `did:pkh:eip155:31337:0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266`
   - Chain ID: 31337 (Hardhat Local)

---

## 🎯 Complete Test Flow

### Test DID-Auth with Issuer

1. **Make sure Hardhat is running**:
   ```bash
   cd blockchain
   npx hardhat node
   ```

2. **Make sure Issuer is running**:
   ```bash
   cd issuer
   npm run dev
   ```

3. **Make sure Client is running**:
   ```bash
   cd client
   npm run dev
   ```

4. **Open browser**: http://localhost:5173/did

5. **Connect MetaMask**

6. **Copy your DID**

7. **Test challenge** (in new browser tab):
   ```
   http://localhost:8080/issuer/challenge?did=YOUR_DID_HERE
   ```

8. **You should see**:
   ```json
   {
     "success": true,
     "challenge": "uuid-timestamp",
     "expiresIn": 300
   }
   ```

---

## 🔧 Troubleshooting

### Problem: MetaMask not detected

**Solution**:
1. Refresh the page
2. Make sure MetaMask is unlocked
3. Check if MetaMask icon shows in toolbar
4. Try restarting browser

### Problem: "Nonce too high" error

**Solution**:
1. Open MetaMask
2. Click account icon → Settings
3. Click "Advanced"
4. Click "Clear activity tab data"
5. Click "Clear"
6. Refresh your app

### Problem: Can't connect to Hardhat

**Solution**:
1. Make sure Hardhat node is running: `npx hardhat node`
2. Check MetaMask network is "Hardhat Local"
3. Check RPC URL is `http://127.0.0.1:8545`
4. Try removing and re-adding the network

### Problem: Wrong chain ID

**Solution**:
1. Open MetaMask
2. Click network dropdown
3. Select "Hardhat Local"
4. If not there, add it again (Step 3)

### Problem: No ETH balance

**Solution**:
1. Make sure you imported the Hardhat test account
2. Make sure Hardhat node is running
3. The test account should have 10,000 ETH
4. If not, restart Hardhat node

---

## 📚 Additional Networks (Optional)

### Sepolia Testnet (for testing on real network)

```
Network Name: Sepolia Testnet
RPC URL: https://sepolia.infura.io/v3/YOUR_INFURA_KEY
Chain ID: 11155111
Currency Symbol: ETH
Block Explorer: https://sepolia.etherscan.io
```

**Get test ETH**: https://sepoliafaucet.com/

### Polygon Mumbai (alternative testnet)

```
Network Name: Polygon Mumbai
RPC URL: https://rpc-mumbai.maticvigil.com
Chain ID: 80001
Currency Symbol: MATIC
Block Explorer: https://mumbai.polygonscan.com
```

**Get test MATIC**: https://faucet.polygon.technology/

---

## 🔒 Security Best Practices

### DO:
- ✅ Write down your Secret Recovery Phrase on paper
- ✅ Store it in a safe place (safe, safety deposit box)
- ✅ Use a strong password
- ✅ Lock MetaMask when not in use
- ✅ Use different accounts for testing and real funds
- ✅ Verify website URLs before connecting

### DON'T:
- ❌ Share your Secret Recovery Phrase with ANYONE
- ❌ Enter your phrase on any website
- ❌ Take screenshots of your phrase
- ❌ Store your phrase digitally (no photos, no cloud)
- ❌ Use test accounts on mainnet
- ❌ Connect to unknown websites

---

## 🎓 MetaMask Basics

### Key Concepts

**Wallet**: Your MetaMask wallet (contains multiple accounts)

**Account**: An Ethereum address (you can have many)

**Private Key**: Secret key that controls an account (NEVER share)

**Secret Recovery Phrase**: 12 words that can recover ALL your accounts

**Network**: Which blockchain you're connected to (Mainnet, Hardhat, etc.)

**Gas**: Fee paid to execute transactions (in ETH)

### Common Actions

**Switch Networks**:
- Click network dropdown at top
- Select network

**Switch Accounts**:
- Click account icon (circle) at top right
- Select account

**Send ETH**:
- Click "Send"
- Enter address and amount
- Click "Next" → "Confirm"

**View Transaction**:
- Click "Activity" tab
- Click transaction to see details

---

## 📞 Need Help?

### MetaMask Support
- Website: https://metamask.io/
- Support: https://support.metamask.io/
- Community: https://community.metamask.io/

### Your Project
- Check: TROUBLESHOOTING.md
- Check: QUICKSTART_ISSUER.md
- Check: VERIFICATION_REPORT.md

---

## ✅ Setup Complete Checklist

- [ ] MetaMask installed in browser
- [ ] Wallet created
- [ ] Secret Recovery Phrase written down and stored safely
- [ ] Hardhat Local network added
- [ ] Test account imported (0xf39Fd...)
- [ ] Hardhat node running
- [ ] MetaMask connected to Hardhat Local
- [ ] Test account has 10,000 ETH
- [ ] Browser console test passed
- [ ] Client app connects to MetaMask
- [ ] DID displayed correctly

**If all checked, you're ready to go!** 🎉

---

## 🚀 Next Steps

1. **Test DID Panel**: http://localhost:5173/did
2. **Connect wallet and see your DID**
3. **Test DID-Auth flow with issuer**
4. **Issue your first verifiable credential**
5. **Build something awesome!**

---

**Last Updated**: November 14, 2025  
**Version**: 1.0.0  
**Status**: Complete
