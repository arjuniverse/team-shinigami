// Storage key prefix for encrypted VCs in localStorage
const VC_STORAGE_PREFIX = 'encrypted_vc_';
const VC_INDEX_KEY = 'vc_index';

// PBKDF2 configuration
const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 256; // bits

/**
 * Derive an AES-GCM encryption key from a passphrase using PBKDF2
 * @param {string} passphrase - User-provided passphrase
 * @param {Uint8Array} salt - Salt for key derivation (16 bytes)
 * @returns {Promise<CryptoKey>} Derived encryption key
 * @throws {Error} If crypto API is unavailable or key derivation fails
 */
export async function deriveKey(passphrase, salt) {
  try {
    // Check if crypto API is available
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error('WebCrypto API is not available in this browser. Please use a modern browser with crypto support.');
    }

    // Import passphrase as key material
    const encoder = new TextEncoder();
    const passphraseKey = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(passphrase),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive AES-GCM key using PBKDF2
    const key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256'
      },
      passphraseKey,
      {
        name: 'AES-GCM',
        length: KEY_LENGTH
      },
      false, // not extractable
      ['encrypt', 'decrypt']
    );

    // TODO: PRODUCTION IMPROVEMENT - Passphrase Strength Requirements
    // Current implementation accepts any passphrase without validation
    // For production, enforce:
    // - Minimum length (e.g., 12 characters)
    // - Complexity requirements (uppercase, lowercase, numbers, symbols)
    // - Check against common password lists
    // - Implement passphrase strength meter in UI
    // - Consider using zxcvbn library for strength estimation
    // - Provide user feedback on passphrase quality

    return key;
  } catch (error) {
    throw new Error(`Failed to derive encryption key: ${error.message}`);
  }
}

/**
 * Encrypt a Verifiable Credential using AES-GCM
 * @param {object} vc - The Verifiable Credential object to encrypt
 * @param {string} passphrase - User-provided passphrase for encryption
 * @returns {Promise<{encrypted: string, salt: string, iv: string}>} Encrypted data with salt and IV
 * @throws {Error} If encryption fails
 */
export async function encryptVC(vc, passphrase) {
  try {
    // Generate random salt and IV
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 12 bytes for AES-GCM

    // Derive encryption key from passphrase
    const key = await deriveKey(passphrase, salt);

    // Convert VC to JSON string and encode to bytes
    const vcString = JSON.stringify(vc);
    const encoder = new TextEncoder();
    const data = encoder.encode(vcString);

    // Encrypt using AES-GCM
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      data
    );

    // Convert to base64 for storage
    const encrypted = arrayBufferToBase64(encryptedBuffer);
    const saltBase64 = arrayBufferToBase64(salt);
    const ivBase64 = arrayBufferToBase64(iv);

    return {
      encrypted,
      salt: saltBase64,
      iv: ivBase64
    };
  } catch (error) {
    throw new Error(`Failed to encrypt credential: ${error.message}`);
  }
}

/**
 * Decrypt a Verifiable Credential using AES-GCM
 * @param {string} encrypted - Base64 encoded encrypted data
 * @param {string} passphrase - User-provided passphrase for decryption
 * @param {string} saltBase64 - Base64 encoded salt
 * @param {string} ivBase64 - Base64 encoded IV
 * @returns {Promise<object>} Decrypted Verifiable Credential object
 * @throws {Error} If decryption fails (wrong passphrase or corrupted data)
 */
export async function decryptVC(encrypted, passphrase, saltBase64, ivBase64) {
  try {
    // Convert from base64
    const encryptedBuffer = base64ToArrayBuffer(encrypted);
    const salt = base64ToArrayBuffer(saltBase64);
    const iv = base64ToArrayBuffer(ivBase64);

    // Derive decryption key from passphrase
    const key = await deriveKey(passphrase, new Uint8Array(salt));

    // Decrypt using AES-GCM
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(iv)
      },
      key,
      encryptedBuffer
    );

    // Convert decrypted bytes to string and parse JSON
    const decoder = new TextDecoder();
    const vcString = decoder.decode(decryptedBuffer);
    const vc = JSON.parse(vcString);

    return vc;
  } catch (error) {
    // AES-GCM will throw if the passphrase is wrong or data is corrupted
    if (error.name === 'OperationError' || error.message.includes('decrypt')) {
      throw new Error('Wrong passphrase or corrupted data. Please check your passphrase and try again.');
    }
    throw new Error(`Failed to decrypt credential: ${error.message}`);
  }
}

/**
 * Store an encrypted Verifiable Credential in localStorage
 * @param {string} vcId - Unique identifier for the VC (e.g., VC's id or credentialSubject.id)
 * @param {object} encryptedData - Object containing encrypted, salt, and iv
 * @param {string} encryptedData.encrypted - Base64 encoded encrypted data
 * @param {string} encryptedData.salt - Base64 encoded salt
 * @param {string} encryptedData.iv - Base64 encoded IV
 * @throws {Error} If localStorage is not available or storage fails
 */
export function storeVC(vcId, encryptedData) {
  try {
    if (!window.localStorage) {
      throw new Error('localStorage is not available. Please enable storage in your browser settings.');
    }

    // Create storage entry with metadata
    const entry = {
      vcId,
      encrypted: encryptedData.encrypted,
      salt: encryptedData.salt,
      iv: encryptedData.iv,
      timestamp: new Date().toISOString()
    };

    // Store the encrypted VC
    const storageKey = `${VC_STORAGE_PREFIX}${vcId}`;
    localStorage.setItem(storageKey, JSON.stringify(entry));

    // Update the index of stored VCs
    updateVCIndex(vcId);

    // TODO: PRODUCTION IMPROVEMENT - Secure Storage
    // localStorage is not encrypted at rest and can be accessed by any script
    // For production, consider:
    // - IndexedDB with encryption layer
    // - Encrypted database with proper key management
    // - Server-side encrypted storage with client-side decryption
    // - Hardware-backed secure storage on mobile devices

  } catch (error) {
    throw new Error(`Failed to store credential: ${error.message}`);
  }
}

/**
 * Retrieve and decrypt all stored Verifiable Credentials
 * @param {string} passphrase - User-provided passphrase for decryption
 * @returns {Promise<Array<object>>} Array of decrypted Verifiable Credential objects
 * @throws {Error} If passphrase is wrong or decryption fails
 */
export async function retrieveVCs(passphrase) {
  try {
    if (!window.localStorage) {
      throw new Error('localStorage is not available. Please enable storage in your browser settings.');
    }

    // Get the index of stored VCs
    const vcIds = getVCIndex();
    
    if (vcIds.length === 0) {
      return [];
    }

    const vcs = [];
    const failedVCs = [];

    // Retrieve and decrypt each VC
    for (const vcId of vcIds) {
      try {
        const storageKey = `${VC_STORAGE_PREFIX}${vcId}`;
        const entryString = localStorage.getItem(storageKey);
        
        if (!entryString) {
          console.warn(`VC with ID ${vcId} not found in storage, skipping...`);
          failedVCs.push(vcId);
          continue;
        }

        const entry = JSON.parse(entryString);
        
        // Decrypt the VC
        const vc = await decryptVC(
          entry.encrypted,
          passphrase,
          entry.salt,
          entry.iv
        );

        vcs.push({
          ...vc,
          _metadata: {
            vcId: entry.vcId,
            storedAt: entry.timestamp
          }
        });
      } catch (error) {
        // Handle corrupted data - log and skip
        console.error(`Failed to decrypt VC ${vcId}:`, error.message);
        failedVCs.push(vcId);
      }
    }

    // Clean up failed VCs from index
    if (failedVCs.length > 0) {
      console.warn(`Skipped ${failedVCs.length} corrupted or inaccessible credentials`);
      cleanupVCIndex(failedVCs);
    }

    return vcs;
  } catch (error) {
    // If it's a passphrase error, throw it directly
    if (error.message.includes('Wrong passphrase')) {
      throw error;
    }
    throw new Error(`Failed to retrieve credentials: ${error.message}`);
  }
}

/**
 * Update the index of stored VC IDs
 * @param {string} vcId - VC ID to add to index
 */
function updateVCIndex(vcId) {
  try {
    const vcIds = getVCIndex();
    
    // Add vcId if not already in index
    if (!vcIds.includes(vcId)) {
      vcIds.push(vcId);
      localStorage.setItem(VC_INDEX_KEY, JSON.stringify(vcIds));
    }
  } catch (error) {
    console.error('Failed to update VC index:', error);
  }
}

/**
 * Get the list of stored VC IDs
 * @returns {Array<string>} Array of VC IDs
 */
function getVCIndex() {
  try {
    const indexString = localStorage.getItem(VC_INDEX_KEY);
    return indexString ? JSON.parse(indexString) : [];
  } catch (error) {
    console.error('Failed to read VC index:', error);
    return [];
  }
}

/**
 * Remove failed VC IDs from the index
 * @param {Array<string>} failedVcIds - Array of VC IDs to remove
 */
function cleanupVCIndex(failedVcIds) {
  try {
    const vcIds = getVCIndex();
    const cleanedIds = vcIds.filter(id => !failedVcIds.includes(id));
    localStorage.setItem(VC_INDEX_KEY, JSON.stringify(cleanedIds));
  } catch (error) {
    console.error('Failed to cleanup VC index:', error);
  }
}

/**
 * Helper function to convert ArrayBuffer to base64
 * @param {ArrayBuffer} buffer - Array buffer
 * @returns {string} Base64 string
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Helper function to convert base64 to ArrayBuffer
 * @param {string} base64 - Base64 string
 * @returns {ArrayBuffer} Array buffer
 */
function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
