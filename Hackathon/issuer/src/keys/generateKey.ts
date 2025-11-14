/**
 * Generate Issuer Keypair for JWT-VC Signing
 * Creates ECDSA secp256k1 private key for ES256K algorithm
 */

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

/**
 * Generate a new ECDSA secp256k1 keypair for JWT signing
 * Creates issuer DID and prints .env configuration
 */
function generateIssuerKey() {
  console.log('🔑 Generating Issuer Keypair for JWT-VC Signing\n');

  // Generate random wallet (secp256k1 keypair)
  const wallet = ethers.Wallet.createRandom();

  // Extract private key (32 bytes hex)
  const privateKey = wallet.privateKey;
  const address = wallet.address;
  const publicKey = wallet.publicKey;

  // Create issuer DID (did:pkh format)
  // Using chain ID 1 (mainnet) for issuer identity
  // In production, use appropriate chain ID
  const chainId = 1; // Ethereum mainnet
  const issuerDid = `did:pkh:eip155:${chainId}:${address.toLowerCase()}`;

  console.log('📋 Generated Keypair:');
  console.log('Private Key:', privateKey);
  console.log('Public Key:', publicKey);
  console.log('Address:', address);
  console.log('Issuer DID:', issuerDid);
  console.log();

  // Generate .env configuration
  const envConfig = `# Issuer Configuration (Generated: ${new Date().toISOString()})
# Keep ISSUER_PRIVATE_KEY secret - never commit to git!

# Issuer private key for JWT-VC signing (ES256K algorithm)
ISSUER_PRIVATE_KEY=${privateKey}

# Issuer DID (derived from address)
ISSUER_DID=${issuerDid}

# Session secret for DID-Auth tokens (change in production)
SESSION_SECRET=${generateRandomSecret()}

# VC token TTL in days
VC_TOKEN_TTL=365

# Server configuration
PORT=8080
NODE_ENV=development
`;

  console.log('📝 .env Configuration:');
  console.log('─'.repeat(60));
  console.log(envConfig);
  console.log('─'.repeat(60));
  console.log();

  // Save to .env.generated file
  const envPath = path.join(process.cwd(), '.env.generated');
  fs.writeFileSync(envPath, envConfig);
  console.log(`✅ Configuration saved to: ${envPath}`);
  console.log();

  // Security warnings
  console.log('⚠️  SECURITY WARNINGS:');
  console.log('1. Keep ISSUER_PRIVATE_KEY secret - never commit to git!');
  console.log('2. Copy .env.generated to .env and customize as needed');
  console.log('3. Change SESSION_SECRET in production');
  console.log('4. Use hardware security modules (HSM) for production keys');
  console.log('5. Backup your private key securely');
  console.log();

  // Usage instructions
  console.log('🚀 Next Steps:');
  console.log('1. cp .env.generated .env');
  console.log('2. Review and customize .env file');
  console.log('3. npm run dev');
  console.log('4. Test DID-Auth flow with client');
  console.log();

  return {
    privateKey,
    publicKey,
    address,
    issuerDid,
    envConfig
  };
}

/**
 * Generate a random session secret
 */
function generateRandomSecret(): string {
  return ethers.hexlify(ethers.randomBytes(32));
}

/**
 * Validate existing private key
 */
function validatePrivateKey(privateKey: string): boolean {
  try {
    const wallet = new ethers.Wallet(privateKey);
    return wallet.address !== null;
  } catch {
    return false;
  }
}

/**
 * Main execution
 */
if (require.main === module) {
  // Check if .env already exists
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env file already exists');
    console.log('Generating new keypair anyway...');
    console.log();
  }

  generateIssuerKey();
}

export { generateIssuerKey, validatePrivateKey };
