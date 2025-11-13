/**
 * Secure Decrypt Page
 * Fetch encrypted file and decry
pt with password
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getDocumentById, DocumentMetadata } from '../lib/metadata';
import { fetchFromLighthouse } from '../lib/lighthouse';
import { deriveKey, decryptBlob, numbersToUint8Array } from '../lib/crypto';
import toast from 'react-hot-toast';

export default function SecureDecrypt() {
  const [searchParams] = useSearchParams();
  const documentId = searchParams.get('id');

  const [document, setDocument] = useState<DocumentMetadata | null>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [decrypted, setDecrypted] = useState(false);
  const [decryptedBlob, setDecryptedBlob] = useState<Blob | null>(null);

  useEffect(() => {
    if (documentId) {
      loadDocument();
    }
  }, [documentId]);

  const loadDocument = async () => {
    if (!documentId) return;

    try {
      const doc = await getDocumentById(documentId);
      setDocument(doc);
    } catch (error: any) {
      toast.error(`Failed to load document: ${error.message}`);
    }
  };

  const handleDecrypt = async () => {
    if (!document || !password) {
      toast.error('Missing document or password');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Fetch encrypted file from Lighthouse
      toast.loading('Fetching encrypted file...');
      const encryptedBlob = await fetchFromLighthouse(document.cid);
      toast.success('File fetched');

      // Step 2: Derive key from password
      toast.loading('Deriving decryption key...');
      const salt = numbersToUint8Array(document.salt);
      const key = await deriveKey(password, salt);

      // Step 3: Decrypt
      toast.loading('Decrypting file...');
      const decrypted = await decryptBlob(encryptedBlob, key, document.iv);
      
      setDecryptedBlob(decrypted);
      setDecrypted(true);
      toast.success('File decrypted successfully!');
    } catch (error: any) {
      console.error('Decryption error:', error);
      
      if (error.message.includes('decrypt')) {
        toast.error('Wrong password or corrupted file');
      } else {
        toast.error(`Decryption failed: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!decryptedBlob || !document) return;

    const url = URL.createObjectURL(decryptedBlob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = document.filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Download started');
  };

  if (!documentId) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="card text-center">
          <p className="text-red-600">No document ID provided</p>
          <a href="/secure-files" className="btn-primary mt-4 inline-block">
            Back to Files
          </a>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Decrypt Document</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Enter your password to decrypt and download the file
      </p>

      <div className="space-y-6">
        {/* Document Info */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Document Information</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Filename:</strong> {document.filename}</p>
            <p><strong>Size:</strong> {(document.encryptedSize / 1024).toFixed(2)} KB</p>
            <p className="break-all"><strong>SHA-256:</strong> {document.sha256}</p>
            <p><strong>Uploaded:</strong> {new Date(document.timestamp).toLocaleString()}</p>
            <p>
              <strong>IPFS:</strong>{' '}
              <a
                href={`https://gateway.lighthouse.storage/ipfs/${document.cid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View on Gateway
              </a>
            </p>
          </div>
        </div>

        {/* Decryption */}
        {!decrypted ? (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Enter Password</h2>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter decryption password"
              className="input-field mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleDecrypt()}
            />
            <button
              onClick={handleDecrypt}
              disabled={!password || loading}
              className="btn-primary w-full"
            >
              {loading ? 'Decrypting...' : 'Decrypt File'}
            </button>
          </div>
        ) : (
          <div className="card bg-green-50 dark:bg-green-900/20">
            <h2 className="text-xl font-semibold mb-4 text-green-600">✅ Decryption Successful</h2>
            <p className="text-sm mb-4">
              Your file has been decrypted successfully. You can now download it.
            </p>
            <div className="flex gap-4">
              <button onClick={handleDownload} className="btn-primary">
                Download File
              </button>
              <a href="/secure-verify" className="btn-primary">
                Verify Document
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
