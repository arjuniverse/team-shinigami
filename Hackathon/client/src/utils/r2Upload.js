/**
 * Utility functions for file encryption and R2 upload
 * Handles client-side encryption before uploading to Cloudflare R2 via issuer service
 */

/**
 * Encrypt a file using AES-GCM encryption
 * @param {File} file - The file to encrypt
 * @returns {Promise<{encrypted: ArrayBuffer, key: string, iv: string, fileName: string, fileSize: number}>} Encrypted data and metadata
 * @throws {Error} If encryption fails or crypto API is unavailable
 */
export async function encryptFile(file) {
  try {
    // Check if crypto API is available
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error('WebCrypto API is not available in this browser. Please use a modern browser with crypto support.');
    }

    // Generate a random AES-GCM key
    const key = await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );

    // Generate a random initialization vector (IV)
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // Read file as ArrayBuffer
    const fileBuffer = await file.arrayBuffer();

    // Encrypt the file
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      fileBuffer
    );

    // Export the key for storage/transmission
    const exportedKey = await window.crypto.subtle.exportKey('raw', key);
    const keyHex = bufferToHex(exportedKey);
    const ivHex = bufferToHex(iv);

    // TODO: PRODUCTION IMPROVEMENT - Secure Key Management
    // Current implementation returns the encryption key to the caller
    // For production, consider:
    // - Key wrapping with user's master key
    // - Key derivation from user passphrase
    // - Storing keys in secure enclave
    // - Using envelope encryption (encrypt data key with master key)
    // - Never exposing raw encryption keys

    return {
      encrypted,
      key: keyHex,
      iv: ivHex,
      fileName: file.name,
      fileSize: file.size
    };
  } catch (error) {
    if (error.message.includes('crypto')) {
      throw error;
    }
    throw new Error(`Failed to encrypt file: ${error.message}`);
  }
}

/**
 * Upload encrypted file to R2 via issuer service
 * @param {ArrayBuffer} encryptedFile - The encrypted file data
 * @param {string} fileName - Original file name
 * @returns {Promise<{storageKey: string, bucket: string, timestamp: string}>} Upload result with storage key
 * @throws {Error} If upload fails or network error occurs
 */
export async function uploadToR2(encryptedFile, fileName) {
  try {
    // Get issuer API URL from environment
    const issuerApiUrl = import.meta.env.VITE_ISSUER_API_URL || 'http://localhost:8080';

    // Create FormData for multipart upload
    const formData = new FormData();
    const blob = new Blob([encryptedFile], { type: 'application/octet-stream' });
    formData.append('file', blob, fileName);

    // Send upload request to issuer service
    const response = await fetch(`${issuerApiUrl}/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errorData.error || `Upload failed with status ${response.status}`);
    }

    const result = await response.json();

    // TODO: PRODUCTION IMPROVEMENT - Direct R2 Upload
    // Current implementation uploads through the issuer service
    // For production, consider:
    // - Pre-signed URLs for direct client-to-R2 upload
    // - Reduces server load and bandwidth costs
    // - Faster uploads with direct connection
    // - Client requests pre-signed URL from issuer, then uploads directly
    // - Issuer validates and tracks uploads via callbacks or polling

    return {
      storageKey: result.storageKey,
      bucket: result.bucket || 'did-vault-mvp',
      timestamp: result.timestamp || new Date().toISOString()
    };
  } catch (error) {
    if (error.message.includes('fetch') || error.message.includes('network')) {
      throw new Error(`Network error during upload: ${error.message}. Please check your connection and try again.`);
    }
    throw new Error(`Failed to upload to R2: ${error.message}`);
  }
}

/**
 * Build claims object from upload metadata for credential issuance
 * @param {string} storageKey - The R2 storage key
 * @param {string} docType - Type of document (e.g., 'passport', 'license', 'certificate')
 * @param {object} additionalClaims - Optional additional claims to include
 * @returns {object} Claims object for credential request
 */
export function buildClaimsFromUpload(storageKey, docType, additionalClaims = {}) {
  const claims = {
    storageKey,
    docType,
    uploadTimestamp: new Date().toISOString(),
    ...additionalClaims
  };

  // TODO: PRODUCTION IMPROVEMENT - Credential Schemas
  // Current implementation uses simple key-value claims
  // For production, consider:
  // - JSON Schema validation for claims
  // - Standardized credential types (e.g., W3C Verifiable Credentials schemas)
  // - Schema registry for credential type definitions
  // - Semantic validation of claim values
  // - Support for complex nested claims structures

  return claims;
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
