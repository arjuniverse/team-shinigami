/**
 * Firestore storage implementation for production
 * Requires Firebase Admin SDK configuration
 */

import { DocumentMetadata } from '../types.js';

// Firestore will be initialized in index.ts if STORAGE_MODE=firestore
let db: any = null;

export function initializeFirestore(firestoreDb: any): void {
  db = firestoreDb;
}

const COLLECTION_NAME = 'documents';

/**
 * Create a new document metadata entry
 */
export async function createDocument(metadata: DocumentMetadata): Promise<DocumentMetadata> {
  if (!db) throw new Error('Firestore not initialized');
  
  const docRef = db.collection(COLLECTION_NAME).doc(metadata.id);
  const doc = await docRef.get();
  
  if (doc.exists) {
    throw new Error(`Document with ID ${metadata.id} already exists`);
  }
  
  await docRef.set(metadata);
  return metadata;
}

/**
 * Get all documents
 */
export async function getAllDocuments(): Promise<DocumentMetadata[]> {
  if (!db) throw new Error('Firestore not initialized');
  
  const snapshot = await db.collection(COLLECTION_NAME).get();
  return snapshot.docs.map((doc: any) => doc.data() as DocumentMetadata);
}

/**
 * Get document by ID
 */
export async function getDocumentById(id: string): Promise<DocumentMetadata | null> {
  if (!db) throw new Error('Firestore not initialized');
  
  const doc = await db.collection(COLLECTION_NAME).doc(id).get();
  return doc.exists ? (doc.data() as DocumentMetadata) : null;
}

/**
 * Get document by SHA-256 hash
 */
export async function getDocumentByHash(sha256: string): Promise<DocumentMetadata | null> {
  if (!db) throw new Error('Firestore not initialized');
  
  const snapshot = await db.collection(COLLECTION_NAME)
    .where('sha256', '==', sha256)
    .limit(1)
    .get();
  
  if (snapshot.empty) return null;
  return snapshot.docs[0].data() as DocumentMetadata;
}

/**
 * Update document transaction hash
 */
export async function updateDocumentTxHash(id: string, txHash: string): Promise<DocumentMetadata> {
  if (!db) throw new Error('Firestore not initialized');
  
  const docRef = db.collection(COLLECTION_NAME).doc(id);
  const doc = await docRef.get();
  
  if (!doc.exists) {
    throw new Error(`Document with ID ${id} not found`);
  }
  
  await docRef.update({ txHash });
  
  const updated = await docRef.get();
  return updated.data() as DocumentMetadata;
}

/**
 * Get documents by owner address
 */
export async function getDocumentsByOwner(ownerAddress: string): Promise<DocumentMetadata[]> {
  if (!db) throw new Error('Firestore not initialized');
  
  const snapshot = await db.collection(COLLECTION_NAME)
    .where('ownerAddress', '==', ownerAddress.toLowerCase())
    .get();
  
  return snapshot.docs.map((doc: any) => doc.data() as DocumentMetadata);
}
