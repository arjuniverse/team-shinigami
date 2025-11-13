/**
 * Storage abstraction layer
 * Switches between JSON and Firestore based on STORAGE_MODE env var
 */

import { DocumentMetadata } from '../types.js';
import * as jsonStorage from './jsonStorage.js';
import * as firestoreStorage from './firestoreStorage.js';

const storageMode = process.env.STORAGE_MODE || 'json';

let storage: typeof jsonStorage | typeof firestoreStorage;

if (storageMode === 'firestore') {
  storage = firestoreStorage;
  console.log('📦 Using Firestore storage');
} else {
  storage = jsonStorage;
  console.log('📦 Using JSON file storage (development mode)');
}

export const initializeFirestore = firestoreStorage.initializeFirestore;
export const createDocument = (metadata: DocumentMetadata) => storage.createDocument(metadata);
export const getAllDocuments = () => storage.getAllDocuments();
export const getDocumentById = (id: string) => storage.getDocumentById(id);
export const getDocumentByHash = (sha256: string) => storage.getDocumentByHash(sha256);
export const updateDocumentTxHash = (id: string, txHash: string) => storage.updateDocumentTxHash(id, txHash);
export const getDocumentsByOwner = (ownerAddress: string) => storage.getDocumentsByOwner(ownerAddress);
