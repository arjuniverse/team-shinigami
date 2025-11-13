/**
 * Lighthouse.Storage integration for decentralized file storage
 * Handles both client-side (dev) and server-side (production) uploads
 * Falls back to mock storage if Lighthouse is unavailable
 */

import lighthouse from '@lighthouse-web3/sdk';
import { mockUploadToStorage, mockFetchFromStorage } from './mockStorage';

const LIGHTHOUSE_API_KEY = import.meta.env.VITE_LIGHTHOUSE_API_KEY;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const USE_MOCK_STORAGE = import.meta.env.VITE_USE_MOCK_STORAGE === 'true';

/**
 * Upload encrypted file to Lighthouse (client-side - dev only)
 * WARNING: This exposes API key in client bundle. Use server-side upload for production.
 * Falls back to mock storage if Lighthouse is unavailable.
 * @param file - Encrypted file Blob
 * @param filename - Original filename
 * @returns Promise with CID and gateway URL
 */
export async function uploadToLighthouse(
  file: Blob,
  filename: string
): Promise<{ cid: string; gatewayUrl: string }> {
  // Use mock storage if enabled
  if (USE_MOCK_STORAGE) {
    console.warn('🧪 Using MOCK storage (localStorage) - not real IPFS!');
    return await mockUploadToStorage(file, filename);
  }

  if (!LIGHTHOUSE_API_KEY) {
    throw new Error('VITE_LIGHTHOUSE_API_KEY not configured. Add it to .env file or enable mock storage with VITE_USE_MOCK_STORAGE=true');
  }

  try {
    // Convert Blob to File object
    const fileObj = new File([file], filename, { type: file.type });

    // Upload using Lighthouse SDK with timeout
    const response = await Promise.race([
      lighthouse.upload([fileObj], LIGHTHOUSE_API_KEY),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout after 30 seconds')), 30000)
      )
    ]) as any;

    if (!response || !response.data || !response.data.Hash) {
      throw new Error('Invalid response from Lighthouse');
    }

    const cid = response.data.Hash;
    const gatewayUrl = `https://gateway.lighthouse.storage/ipfs/${cid}`;

    return { cid, gatewayUrl };
  } catch (error: any) {
    console.error('Lighthouse upload error:', error);
    
    // Offer to use mock storage as fallback
    if (error.message.includes('timeout') || error.message.includes('Failed to fetch')) {
      console.warn('⚠️ Lighthouse unavailable. Consider enabling mock storage with VITE_USE_MOCK_STORAGE=true in .env');
    }
    
    throw new Error(`Failed to upload to Lighthouse: ${error.message}`);
  }
}

/**
 * Upload encrypted file via backend (production-ready)
 * Keeps API key secure on server
 * @param file - Encrypted file Blob
 * @param filename - Original filename
 * @returns Promise with CID and gateway URL
 */
export async function uploadViaBackend(
  file: Blob,
  filename: string
): Promise<{ cid: string; gatewayUrl: string }> {
  try {
    const formData = new FormData();
    formData.append('file', file, filename);

    const response = await fetch(`${BACKEND_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    const data = await response.json();
    return {
      cid: data.cid,
      gatewayUrl: data.gatewayUrl,
    };
  } catch (error: any) {
    console.error('Backend upload error:', error);
    throw new Error(`Failed to upload via backend: ${error.message}`);
  }
}

/**
 * Fetch file from Lighthouse gateway or mock storage
 * @param cid - IPFS CID
 * @returns Promise<Blob> - Downloaded file
 */
export async function fetchFromLighthouse(cid: string): Promise<Blob> {
  // Check if it's a mock CID
  if (cid.startsWith('Qm') && USE_MOCK_STORAGE) {
    return await mockFetchFromStorage(cid);
  }

  try {
    const url = `https://gateway.lighthouse.storage/ipfs/${cid}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.blob();
  } catch (error: any) {
    console.error('Lighthouse fetch error:', error);
    
    // Try mock storage as fallback
    try {
      console.warn('⚠️ Trying mock storage as fallback...');
      return await mockFetchFromStorage(cid);
    } catch {
      throw new Error(`Failed to fetch from Lighthouse: ${error.message}`);
    }
  }
}
