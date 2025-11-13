/**
 * JSON file-based storage implementation for development/MVP
 * For production, use Firestore or another database
 */

import fs from 'fs/promises';
import path from 'path';
import { DocumentMetadata } from '../types.js';

const DB_FILE = path.join(process.cwd(), 'db.json');

interface Database {
  documents: DocumentMetadata[];
}

/**
 * Initialize database file if it doesn't exist
 */
async function initDb(): Promise<void> {
  try {
    await fs.access(DB_FILE);
  } catch {
    const initialDb: Database = { documents: [] };
    await fs.writeFile(DB_FILE, JSON.stringify(initialDb, null, 2));
  }
}

/**
 * Read database from file
 */
async function readDb(): Promise<Database> {
  await initDb();
  const data = await fs.readFile(DB_FILE, 'utf-8');
  return JSON.parse(data);
}

/**
 * Write database to file
 */
async function writeDb(db: Database): Promise<void> {
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2));
}

/**
 * Create a new document metadata entry
 */
export async function createDocument(metadata: DocumentMetadata): Promise<DocumentMetadata> {
  const db = await readDb();
  
  // Check for duplicate ID
  if (db.documents.some(doc => doc.id === metadata.id)) {
    throw new Error(`Document with ID ${metadata.id} already exists`);
  }
  
  db.documents.push(metadata);
  await writeDb(db);
  
  return metadata;
}

/**
 * Get all documents
 */
export async function getAllDocuments(): Promise<DocumentMetadata[]> {
  const db = await readDb();
  return db.documents;
}

/**
 * Get document by ID
 */
export async function getDocumentById(id: string): Promise<DocumentMetadata | null> {
  const db = await readDb();
  return db.documents.find(doc => doc.id === id) || null;
}

/**
 * Get document by SHA-256 hash
 */
export async function getDocumentByHash(sha256: string): Promise<DocumentMetadata | null> {
  const db = await readDb();
  return db.documents.find(doc => doc.sha256 === sha256) || null;
}

/**
 * Update document transaction hash
 */
export async function updateDocumentTxHash(id: string, txHash: string): Promise<DocumentMetadata> {
  const db = await readDb();
  const docIndex = db.documents.findIndex(doc => doc.id === id);
  
  if (docIndex === -1) {
    throw new Error(`Document with ID ${id} not found`);
  }
  
  db.documents[docIndex].txHash = txHash;
  await writeDb(db);
  
  return db.documents[docIndex];
}

/**
 * Get documents by owner address
 */
export async function getDocumentsByOwner(ownerAddress: string): Promise<DocumentMetadata[]> {
  const db = await readDb();
  return db.documents.filter(doc => 
    doc.ownerAddress.toLowerCase() === ownerAddress.toLowerCase()
  );
}
