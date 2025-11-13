/**
 * Client-side encryption utilities using Web Crypto API
 * AES-256-GCM with PBKDF2 key derivation
 */

// PBKDF2 configuration for key derivation
const PBKDF2_ITERATIONS = 200000; // ≥200k iterations for security
const KEY_LENGTH = 256; // bits
const SALT_LENGTH = 16; // bytes
const IV_LENGTH = 12; // bytes for AES-GCM

/**
 * Compute SHA-256 hash of a Blob
 * @param blob - File or Blob to hash
 * @returns Promise<string> - 64-character hex string
 */
export async function sha256Hex(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Derive AES-256-GCM key from password using PBKDF2
 * @param password - User password
 * @param salt - 16-byte salt (Uint8Array)
 * @returns Promise<CryptoKey> - Derived encryption key
 */
export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  if (salt.length !== SALT_LENGTH) {
    throw new Error(`Salt must be ${SALT_LENGTH} bytes`);
  }

  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    {
      name: 'AES-GCM',
      length: KEY_LENGTH,
    },
    false, // not extractable
    ['encrypt', 'decrypt']
  );

  return key;
}

/**
 * Encrypt a Blob using AES-256-GCM
 * @param blob - File or Blob to encrypt
 * @param key - CryptoKey from deriveKey()
 * @returns Promise with encrypted Blob and IV
 */
export async function encryptBlob(
  blob: Blob,
  key: CryptoKey
): Promise<{ cipherBlob: Blob; iv: number[] }> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const arrayBuffer = await blob.arrayBuffer();

  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    arrayBuffer
  );

  const cipherBlob = new Blob([encrypted], { type: 'application/octet-stream' });
  return {
    cipherBlob,
    iv: Array.from(iv), // Convert to array for serialization
  };
}

/**
 * Decrypt a Blob using AES-256-GCM
 * @param cipherBlob - Encrypted Blob
 * @param key - CryptoKey from deriveKey()
 * @param iv - Initialization vector (12-byte array)
 * @returns Promise<Blob> - Decrypted Blob
 */
export async function decryptBlob(
  cipherBlob: Blob,
  key: CryptoKey,
  iv: number[]
): Promise<Blob> {
  if (iv.length !== IV_LENGTH) {
    throw new Error(`IV must be ${IV_LENGTH} bytes`);
  }

  const ivArray = new Uint8Array(iv);
  const encryptedBuffer = await cipherBlob.arrayBuffer();

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivArray,
    },
    key,
    encryptedBuffer
  );

  return new Blob([decrypted]);
}

/**
 * Generate random salt for PBKDF2
 * @returns Uint8Array - 16-byte salt
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Convert Uint8Array to number array for serialization
 */
export function uint8ArrayToNumbers(arr: Uint8Array): number[] {
  return Array.from(arr);
}

/**
 * Convert number array to Uint8Array
 */
export function numbersToUint8Array(arr: number[]): Uint8Array {
  return new Uint8Array(arr);
}
