/**
 * Backend API client for metadata management
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export interface DocumentMetadata {
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

export interface CreateMetadataRequest {
  filename: string;
  cid: string;
  sha256: string;
  encryptedSize: number;
  ownerAddress: string;
  iv: number[];
  salt: number[];
}

/**
 * Create new document metadata
 */
export async function createMetadata(data: CreateMetadataRequest): Promise<DocumentMetadata> {
  const response = await fetch(`${BACKEND_URL}/api/metadata`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to create metadata');
  }

  return result.data;
}

/**
 * Get all documents (optionally filter by owner)
 */
export async function getDocuments(ownerAddress?: string): Promise<DocumentMetadata[]> {
  const url = ownerAddress
    ? `${BACKEND_URL}/api/metadata?owner=${ownerAddress}`
    : `${BACKEND_URL}/api/metadata`;

  const response = await fetch(url);
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to fetch documents');
  }

  return result.data;
}

/**
 * Get document by ID
 */
export async function getDocumentById(id: string): Promise<DocumentMetadata> {
  const response = await fetch(`${BACKEND_URL}/api/metadata/${id}`);
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to fetch document');
  }

  return result.data;
}

/**
 * Get document by SHA-256 hash
 */
export async function getDocumentByHash(sha256: string): Promise<DocumentMetadata> {
  const response = await fetch(`${BACKEND_URL}/api/metadata/byHash/${sha256}`);
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to fetch document');
  }

  return result.data;
}

/**
 * Update document with transaction hash
 */
export async function updateTxHash(id: string, txHash: string): Promise<DocumentMetadata> {
  const response = await fetch(`${BACKEND_URL}/api/metadata/updateTx`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, txHash }),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to update transaction hash');
  }

  return result.data;
}
