// Storage keys for localStorage
const DID_STORAGE_KEY = 'did_vault_did';
const PRIVATE_KEY_STORAGE_KEY = 'did_vault_private_key';

/**
 * Generate a new did:key identifier with associated key pair
 * Uses Ed25519 key generation via WebCrypto API
 * @returns {Promise<{did: string, privateKey: string}>} The generated DID and private key
 * @throws {Error} If crypto API is unavailable or DID generation fails
 */
export async function generateDidKey() {
  try {
    // Check if crypto API is available
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error('WebCrypto API is not available in this browser. Please use a modern browser with crypto support.');
    }

    // Generate Ed25519 key pair
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'Ed25519',
      },
      true, // extractable
      ['sign', 'verify']
    );

    // Export the private key
    const privateKeyBuffer = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
    const privateKeyHex = bufferToHex(privateKeyBuffer);

    // Export the public key
    const publicKeyBuffer = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
    const publicKeyBytes = new Uint8Array(publicKeyBuffer);
    
    // Extract raw public key (last 32 bytes of SPKI format)
    const rawPublicKey = publicKeyBytes.slice(-32);
    
    // Create did:key identifier using multicodec prefix for Ed25519
    // Multicodec prefix for Ed25519 public key: 0xed01
    const multicodecPrefix = new Uint8Array([0xed, 0x01]);
    const multicodecKey = new Uint8Array(multicodecPrefix.length + rawPublicKey.length);
    multicodecKey.set(multicodecPrefix);
    multicodecKey.set(rawPublicKey, multicodecPrefix.length);
    
    // Base58 encode the multicodec key
    const base58Key = base58Encode(multicodecKey);
    const did = `did:key:z${base58Key}`;

    // TODO: PRODUCTION IMPROVEMENT - Secure Key Storage
    // Current implementation stores private keys in localStorage which is NOT secure
    // For production, consider:
    // - Hardware Security Module (HSM) integration
    // - Secure Enclave on mobile devices
    // - Browser extension with isolated storage
    // - WebAuthn for key management
    // - Never expose private keys directly

    // TODO: PRODUCTION IMPROVEMENT - DID Method
    // did:key is ephemeral and not resolvable on-chain
    // For production, migrate to:
    // - did:ethr for Ethereum-based DIDs with on-chain resolution
    // - did:web for web-based DID documents
    // - did:ion for Bitcoin-anchored DIDs

    return {
      did,
      privateKey: privateKeyHex
    };
  } catch (error) {
    if (error.message.includes('crypto')) {
      throw error;
    }
    throw new Error(`Failed to generate DID: ${error.message}`);
  }
}

/**
 * Store DID and private key in browser localStorage
 * @param {string} did - The DID identifier
 * @param {string} privateKey - The private key hex string
 * @throws {Error} If localStorage is not available
 */
export function storeDid(did, privateKey) {
  try {
    if (!window.localStorage) {
      throw new Error('localStorage is not available. Please enable storage in your browser settings.');
    }

    localStorage.setItem(DID_STORAGE_KEY, did);
    localStorage.setItem(PRIVATE_KEY_STORAGE_KEY, privateKey);

    // TODO: PRODUCTION IMPROVEMENT - Secure Key Storage
    // Storing unencrypted private keys in localStorage is a security risk
    // Consider encrypting the private key with a user-provided passphrase
    // or using more secure storage mechanisms like:
    // - IndexedDB with encryption
    // - Hardware-backed keystores
    // - Encrypted with user passphrase using PBKDF2
  } catch (error) {
    throw new Error(`Failed to store DID: ${error.message}`);
  }
}

/**
 * Retrieve DID and private key from browser localStorage
 * @returns {{did: string | null, privateKey: string | null}} The stored DID and private key, or null if not found
 */
export function retrieveDid() {
  try {
    const did = localStorage.getItem(DID_STORAGE_KEY);
    const privateKey = localStorage.getItem(PRIVATE_KEY_STORAGE_KEY);

    return {
      did,
      privateKey
    };
  } catch (error) {
    console.error('Failed to retrieve DID from storage:', error);
    return {
      did: null,
      privateKey: null
    };
  }
}

/**
 * Sign a Verifiable Presentation with the holder's DID
 * @param {object} vp - The unsigned Verifiable Presentation object
 * @param {string} privateKeyHex - The holder's private key in hex format
 * @returns {Promise<object>} The signed Verifiable Presentation with proof
 * @throws {Error} If signing fails or crypto API is unavailable
 */
export async function signPresentation(vp, privateKeyHex) {
  try {
    // Check if crypto API is available
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error('WebCrypto API is not available in this browser. Please use a modern browser with crypto support.');
    }

    // Create the payload to sign (canonical JSON representation)
    const payload = {
      '@context': vp['@context'],
      type: vp.type,
      holder: vp.holder,
      verifiableCredential: vp.verifiableCredential,
      iat: Math.floor(Date.now() / 1000)
    };

    // Convert payload to bytes for signing
    const payloadString = JSON.stringify(payload);
    const encoder = new TextEncoder();
    const data = encoder.encode(payloadString);

    // Import the private key for signing (PKCS8 format)
    const privateKeyBuffer = hexToBuffer(privateKeyHex);
    const cryptoKey = await window.crypto.subtle.importKey(
      'pkcs8',
      privateKeyBuffer,
      {
        name: 'Ed25519'
      },
      false,
      ['sign']
    );

    // Sign the data
    const signature = await window.crypto.subtle.sign(
      'Ed25519',
      cryptoKey,
      data
    );

    // Create base64url encoded signature
    const signatureBase64 = arrayBufferToBase64Url(signature);
    const payloadBase64 = btoa(payloadString);

    // Add proof to VP following W3C VC Data Model
    const signedVP = {
      ...vp,
      proof: {
        type: 'Ed25519Signature2020',
        created: new Date().toISOString(),
        proofPurpose: 'authentication',
        verificationMethod: `${vp.holder}#keys-1`,
        jws: `${payloadBase64}..${signatureBase64}`
      }
    };

    // TODO: PRODUCTION IMPROVEMENT - Use Veramo for VP Signing
    // This simplified signing implementation is for MVP demonstration
    // For production, use Veramo's createVerifiablePresentation method
    // which provides proper JWT or JSON-LD proof formats and handles
    // all cryptographic operations securely with proper key management

    return signedVP;
  } catch (error) {
    throw new Error(`Failed to sign presentation: ${error.message}`);
  }
}

/**
 * Helper function to convert hex string to ArrayBuffer
 * @param {string} hex - Hex string
 * @returns {ArrayBuffer} Array buffer
 */
function hexToBuffer(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

/**
 * Helper function to convert ArrayBuffer to hex string
 * @param {ArrayBuffer} buffer - Array buffer
 * @returns {string} Hex string
 */
function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Helper function to convert ArrayBuffer to base64url
 * @param {ArrayBuffer} buffer - Array buffer
 * @returns {string} Base64url string
 */
function arrayBufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Base58 encoding for did:key generation
 * @param {Uint8Array} bytes - Bytes to encode
 * @returns {string} Base58 encoded string
 */
function base58Encode(bytes) {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const BASE = BigInt(58);
  
  // Convert bytes to BigInt
  let num = BigInt(0);
  for (let i = 0; i < bytes.length; i++) {
    num = num * BigInt(256) + BigInt(bytes[i]);
  }
  
  // Convert to base58
  let encoded = '';
  while (num > 0) {
    const remainder = num % BASE;
    num = num / BASE;
    encoded = ALPHABET[Number(remainder)] + encoded;
  }
  
  // Add leading '1's for leading zero bytes
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    encoded = '1' + encoded;
  }
  
  return encoded;
}
