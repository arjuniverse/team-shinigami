/**
 * Type definitions for secure document workflow backend
 */

export interface DocumentMetadata {
  id: string;
  filename: string;
  cid: string; // Lighthouse IPFS CID
  sha256: string; // SHA-256 hash of original file (hex)
  encryptedSize: number; // Size in bytes
  timestamp: string; // ISO 8601 timestamp
  ownerAddress: string; // Ethereum address
  iv: number[]; // Initialization vector for AES-GCM (12 bytes)
  salt: number[]; // Salt for PBKDF2 (16 bytes)
  txHash?: string; // Blockchain transaction hash (optional, added after on-chain anchoring)
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

export interface UpdateTxRequest {
  id: string;
  txHash: string;
}

export interface MetadataResponse {
  success: boolean;
  data?: DocumentMetadata | DocumentMetadata[];
  message?: string;
  error?: string;
}
