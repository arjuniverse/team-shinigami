/**
 * Secure Verify Page
 * Re-upload file to verify hash against backend and blockchain
 */

import { useState } from 'react';
import { sha256Hex } from '../lib/crypto';
import { getDocumentByHash } from '../lib/metadata';
import { checkHashOnChain, getHashTimestamp } from '../lib/blockchain';
import toast from 'react-hot-toast';

export default function SecureVerify() {
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [results, setResults] = useState<{
    backendMatch: boolean;
    blockchainMatch: boolean;
    metadata?: any;
    timestamp?: number;
  } | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setVerified(false);
    setResults(null);

    // Compute hash
    toast.loading('Computing SHA-256...');
    try {
      const computedHash = await sha256Hex(selectedFile);
      setHash(computedHash);
      toast.success('Hash computed');
    } catch (error: any) {
      toast.error(`Hash computation failed: ${error.message}`);
    }
  };

  const handleVerify = async () => {
    if (!hash) {
      toast.error('No hash to verify');
      return;
    }

    setLoading(true);

    try {
      // Check backend
      toast.loading('Checking backend metadata...');
      let metadata = null;
      let backendMatch = false;
      
      try {
        metadata = await getDocumentByHash(hash);
        backendMatch = true;
        toast.success('Found in backend');
      } catch (error) {
        toast.error('Not found in backend');
      }

      // Check blockchain
      toast.loading('Checking blockchain...');
      const blockchainMatch = await checkHashOnChain(hash);
      
      if (blockchainMatch) {
        toast.success('Found on blockchain');
      } else {
        toast.error('Not found on blockchain');
      }

      // Get timestamp if on blockchain
      let timestamp;
      if (blockchainMatch) {
        timestamp = await getHashTimestamp(hash);
      }

      setResults({
        backendMatch,
        blockchainMatch,
        metadata,
        timestamp,
      });
      setVerified(true);

    } catch (error: any) {
      console.error('Verification error:', error);
      toast.error(`Verification failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (ts: number) => {
    return new Date(ts * 1000).toLocaleString();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Verify Document</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Upload a file to verify its authenticity against backend and blockchain records
      </p>

      <div className="space-y-6">
        {/* File Upload */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">1. Select File to Verify</h2>
          <input
            type="file"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
          {file && (
            <div className="mt-4 text-sm">
              <p><strong>File:</strong> {file.name}</p>
              <p className="break-all"><strong>SHA-256:</strong> {hash}</p>
            </div>
          )}
        </div>

        {/* Verify Button */}
        {hash && !verified && (
          <button
            onClick={handleVerify}
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Verifying...' : 'Verify Document'}
          </button>
        )}

        {/* Results */}
        {verified && results && (
          <div className="space-y-4">
            {/* Backend Check */}
            <div className={`card ${results.backendMatch ? 'bg-green-50 dark:bg-green-900/20 border-green-200' : 'bg-red-50 dark:bg-red-900/20 border-red-200'}`}>
              <h3 className="text-lg font-semibold mb-2">
                {results.backendMatch ? '✅ Backend: MATCH' : '❌ Backend: NOT FOUND'}
              </h3>
              {results.backendMatch && results.metadata && (
                <div className="text-sm space-y-1">
                  <p><strong>Filename:</strong> {results.metadata.filename}</p>
                  <p><strong>Uploaded:</strong> {new Date(results.metadata.timestamp).toLocaleString()}</p>
                  <p><strong>Owner:</strong> {results.metadata.ownerAddress}</p>
                  <p><strong>CID:</strong> {results.metadata.cid}</p>
                </div>
              )}
              {!results.backendMatch && (
                <p className="text-sm text-red-700">
                  This document hash was not found in the backend database.
                </p>
              )}
            </div>

            {/* Blockchain Check */}
            <div className={`card ${results.blockchainMatch ? 'bg-green-50 dark:bg-green-900/20 border-green-200' : 'bg-red-50 dark:bg-red-900/20 border-red-200'}`}>
              <h3 className="text-lg font-semibold mb-2">
                {results.blockchainMatch ? '✅ Blockchain: MATCH' : '❌ Blockchain: NOT FOUND'}
              </h3>
              {results.blockchainMatch && results.timestamp && (
                <div className="text-sm space-y-1">
                  <p><strong>Stored on:</strong> {formatTimestamp(results.timestamp)}</p>
                  <p className="text-green-700">
                    This document hash is permanently anchored on the blockchain.
                  </p>
                </div>
              )}
              {!results.blockchainMatch && (
                <p className="text-sm text-red-700">
                  This document hash was not found on the blockchain.
                </p>
              )}
            </div>

            {/* Overall Result */}
            <div className={`card ${results.backendMatch && results.blockchainMatch ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'}`}>
              <h3 className="text-xl font-bold mb-2">
                {results.backendMatch && results.blockchainMatch
                  ? '🎉 Document Verified!'
                  : '⚠️ Verification Incomplete'}
              </h3>
              <p className="text-sm">
                {results.backendMatch && results.blockchainMatch
                  ? 'This document is authentic and has been verified against both backend records and blockchain.'
                  : results.backendMatch || results.blockchainMatch
                  ? 'This document was found in some records but not all. It may be partially verified.'
                  : 'This document could not be verified. It may not have been uploaded through this system.'}
              </p>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setHash('');
                setVerified(false);
                setResults(null);
              }}
              className="btn-primary w-full"
            >
              Verify Another Document
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
