/**
 * Secure Files List Page
 * Display uploaded files with metadata
 */

import { useState, useEffect } from 'react';
import { getDocuments, DocumentMetadata } from '../lib/metadata';
import { getLocalMetadata } from '../lib/localMetadata';
import { getCurrentAccount } from '../lib/blockchain';
import { getStorageInfo, clearAllMockFiles } from '../lib/mockStorage';
import toast from 'react-hot-toast';

export default function SecureFiles() {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOwner, setFilterOwner] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [storageInfo, setStorageInfo] = useState(getStorageInfo());

  useEffect(() => {
    loadDocuments();
    loadWallet();
  }, [filterOwner]);

  const loadWallet = async () => {
    try {
      const address = await getCurrentAccount();
      if (address) setWalletAddress(address);
    } catch (error) {
      console.error('Failed to load wallet:', error);
    }
  };

  const loadDocuments = async () => {
    setLoading(true);
    try {
      let docs: DocumentMetadata[] = [];
      
      // Try to load from backend
      try {
        const ownerFilter = filterOwner && walletAddress ? walletAddress : undefined;
        docs = await getDocuments(ownerFilter);
      } catch (error) {
        console.warn('Backend not available, loading from local storage');
      }
      
      // Also load from local storage
      const localDocs = getLocalMetadata();
      
      // Merge and deduplicate (prefer backend data)
      const allDocs = [...docs];
      localDocs.forEach(localDoc => {
        if (!allDocs.some(d => d.sha256 === localDoc.sha256)) {
          allDocs.push(localDoc as any);
        }
      });
      
      // Sort by timestamp
      setDocuments(allDocs.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ));
      
      // Update storage info
      setStorageInfo(getStorageInfo());
      
      if (localDocs.length > 0 && docs.length === 0) {
        toast.success(`Loaded ${localDocs.length} files from local storage`);
      }
    } catch (error: any) {
      toast.error(`Failed to load documents: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearStorage = () => {
    if (confirm('Clear all mock files from localStorage? This cannot be undone!')) {
      const cleared = clearAllMockFiles();
      toast.success(`Cleared ${cleared} files from storage`);
      loadDocuments();
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString();
  };

  const truncate = (str: string, len: number = 16) => {
    if (str.length <= len) return str;
    return `${str.slice(0, len / 2)}...${str.slice(-len / 2)}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Secure Files</h1>
            <p className="text-gray-600 dark:text-gray-400">
              View and manage your encrypted documents
            </p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filterOwner}
                onChange={(e) => setFilterOwner(e.target.checked)}
                className="rounded"
              />
              My files only
            </label>
            <button onClick={loadDocuments} className="btn-primary">
              Refresh
            </button>
          </div>
        </div>
        
        {/* Storage Info - Always show if using mock storage */}
        {import.meta.env.VITE_USE_MOCK_STORAGE === 'true' && (
          <div className="card bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex justify-between items-center">
              <div className="text-sm">
                <p className="font-semibold text-blue-900 dark:text-blue-100">
                  Mock Storage Usage
                </p>
                <p className="text-blue-700 dark:text-blue-300">
                  {(storageInfo.used / (1024 * 1024)).toFixed(2)} MB used • {storageInfo.files} files
                  {storageInfo.files === 0 && ' (empty)'}
                </p>
              </div>
              <button
                onClick={handleClearStorage}
                disabled={storageInfo.files === 0}
                className={`text-sm px-3 py-1 rounded ${
                  storageInfo.files === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                Clear Storage
              </button>
            </div>
            {storageInfo.used / storageInfo.total > 0.8 && storageInfo.files > 0 && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                ⚠️ Storage almost full! Consider clearing old files or using smaller files.
              </p>
            )}
            {storageInfo.files === 0 && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                💡 Using mock storage (localStorage). Upload files to see them here.
              </p>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading documents...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600 mb-4">No documents found</p>
          <a href="/secure-upload" className="btn-primary inline-block">
            Upload Your First Document
          </a>
        </div>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <div key={doc.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{doc.filename}</h3>
                  <p className="text-xs text-gray-500">{formatDate(doc.timestamp)}</p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`https://gateway.lighthouse.storage/ipfs/${doc.cid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    View IPFS
                  </a>
                  <a
                    href={`/secure-decrypt?id=${doc.id}`}
                    className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    Decrypt
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">CID</p>
                  <p className="font-mono text-xs break-all">{truncate(doc.cid, 20)}</p>
                </div>
                <div>
                  <p className="text-gray-500">SHA-256</p>
                  <p className="font-mono text-xs break-all">{truncate(doc.sha256, 20)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Size</p>
                  <p>{(doc.encryptedSize / 1024).toFixed(2)} KB</p>
                </div>
                <div>
                  <p className="text-gray-500">Owner</p>
                  <p className="font-mono text-xs">{truncate(doc.ownerAddress, 16)}</p>
                </div>
              </div>

              {doc.txHash && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 mb-1">Blockchain Transaction</p>
                  <p className="font-mono text-xs text-green-600 break-all">{doc.txHash}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
