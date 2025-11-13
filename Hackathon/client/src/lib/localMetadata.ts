/**
 * Local metadata storage (fallback when backend is unavailable)
 * Stores document metadata in localStorage
 */

const LOCAL_METADATA_KEY = 'local_document_metadata';

export interface LocalDocumentMetadata {
  id: string;
  filename: string;
  cid: string;
  sha256: string;
  encryptedSize: number;
  timestamp: string;
  ownerAddress: string;
  iv: number[];
  salt: number[];
  txHash?: string;
}

/**
 * Save metadata locally
 */
export function saveLocalMetadata(metadata: LocalDocumentMetadata): void {
  try {
    const existing = getLocalMetadata();
    existing.push(metadata);
    localStorage.setItem(LOCAL_METADATA_KEY, JSON.stringify(existing));
    console.log('📝 Metadata saved locally');
  } catch (error) {
    console.error('Failed to save local metadata:', error);
  }
}

/**
 * Get all local metadata
 */
export function getLocalMetadata(): LocalDocumentMetadata[] {
  try {
    const data = localStorage.getItem(LOCAL_METADATA_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to read local metadata:', error);
    return [];
  }
}

/**
 * Get metadata by ID
 */
export function getLocalMetadataById(id: string): LocalDocumentMetadata | null {
  const all = getLocalMetadata();
  return all.find(m => m.id === id) || null;
}

/**
 * Get metadata by SHA-256 hash
 */
export function getLocalMetadataByHash(sha256: string): LocalDocumentMetadata | null {
  const all = getLocalMetadata();
  return all.find(m => m.sha256 === sha256) || null;
}

/**
 * Update transaction hash
 */
export function updateLocalTxHash(id: string, txHash: string): void {
  try {
    const all = getLocalMetadata();
    const index = all.findIndex(m => m.id === id);
    if (index !== -1) {
      all[index].txHash = txHash;
      localStorage.setItem(LOCAL_METADATA_KEY, JSON.stringify(all));
      console.log('📝 Transaction hash updated locally');
    }
  } catch (error) {
    console.error('Failed to update local tx hash:', error);
  }
}

/**
 * Clear all local metadata
 */
export function clearLocalMetadata(): void {
  localStorage.removeItem(LOCAL_METADATA_KEY);
}
