/**
 * Mock storage for testing when Lighthouse is unavailable
 * This simulates IPFS storage using browser localStorage
 * FOR DEVELOPMENT/TESTING ONLY - NOT FOR PRODUCTION
 */

const MOCK_STORAGE_PREFIX = 'mock_ipfs_';

/**
 * Mock upload to simulate Lighthouse storage
 * Stores file in localStorage and generates a fake CID
 */
export async function mockUploadToStorage(
  file: Blob,
  filename: string
): Promise<{ cid: string; gatewayUrl: string }> {
  // Convert blob to base64 for storage
  const base64 = await blobToBase64(file);
  
  // Generate a fake CID (simulating IPFS)
  const fakeCid = `Qm${generateRandomHash(44)}`;
  
  // Store in localStorage
  const storageKey = `${MOCK_STORAGE_PREFIX}${fakeCid}`;
  try {
    localStorage.setItem(storageKey, JSON.stringify({
      filename,
      data: base64,
      size: file.size,
      type: file.type,
      timestamp: new Date().toISOString(),
    }));
  } catch (error: any) {
    if (error.name === 'QuotaExceededError') {
      throw new Error(
        `Storage quota exceeded! localStorage is full (5-10MB limit). ` +
        `File size: ${(file.size / 1024).toFixed(2)}KB. ` +
        `Please clear old files or use smaller files for testing.`
      );
    }
    throw error;
  }
  
  // Return fake gateway URL
  const gatewayUrl = `mock://localhost/ipfs/${fakeCid}`;
  
  console.warn('⚠️ Using MOCK storage (localStorage). File is NOT on IPFS!');
  
  return { cid: fakeCid, gatewayUrl };
}

/**
 * Mock fetch from storage
 */
export async function mockFetchFromStorage(cid: string): Promise<Blob> {
  const storageKey = `${MOCK_STORAGE_PREFIX}${cid}`;
  const stored = localStorage.getItem(storageKey);
  
  if (!stored) {
    throw new Error(`Mock file not found: ${cid}`);
  }
  
  const { data, type } = JSON.parse(stored);
  return base64ToBlob(data, type);
}

/**
 * Helper: Convert Blob to base64
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Helper: Convert base64 to Blob
 */
function base64ToBlob(base64: string, type: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type });
}

/**
 * Helper: Generate random hash
 */
function generateRandomHash(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * List all mock stored files
 */
export function listMockFiles(): Array<{ cid: string; filename: string; size: number; timestamp: string }> {
  const files = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(MOCK_STORAGE_PREFIX)) {
      const cid = key.replace(MOCK_STORAGE_PREFIX, '');
      const data = JSON.parse(localStorage.getItem(key)!);
      files.push({
        cid,
        filename: data.filename,
        size: data.size,
        timestamp: data.timestamp,
      });
    }
  }
  return files;
}

/**
 * Get storage usage info
 */
export function getStorageInfo(): { used: number; total: number; files: number } {
  let used = 0;
  let files = 0;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(MOCK_STORAGE_PREFIX)) {
      const value = localStorage.getItem(key);
      if (value) {
        used += value.length * 2; // Approximate bytes (UTF-16)
        files++;
      }
    }
  }
  
  // localStorage typically has 5-10MB limit
  const total = 10 * 1024 * 1024; // Assume 10MB
  
  return { used, total, files };
}

/**
 * Clear old mock files (keep only N most recent)
 */
export function clearOldMockFiles(keepCount: number = 5): number {
  const files = listMockFiles();
  
  // Sort by timestamp (oldest first)
  files.sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  // Remove oldest files
  const toRemove = files.slice(0, Math.max(0, files.length - keepCount));
  toRemove.forEach(file => {
    localStorage.removeItem(`${MOCK_STORAGE_PREFIX}${file.cid}`);
  });
  
  return toRemove.length;
}

/**
 * Clear all mock files
 */
export function clearAllMockFiles(): number {
  let count = 0;
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith(MOCK_STORAGE_PREFIX)) {
      localStorage.removeItem(key);
      count++;
    }
  }
  return count;
}
