/**
 * DID Panel Component
 * UI for displaying and managing user's DID (Decentralized Identifier)
 */

import { useState } from 'react';
import { 
  getConnectedAddress, 
  createDidPkh, 
  formatDidDocument, 
  getChainId 
} from '../lib/did';
import toast from 'react-hot-toast';

export default function DidPanel() {
  const [address, setAddress] = useState<string>('');
  const [did, setDid] = useState<string>('');
  const [didDocument, setDidDocument] = useState<object | null>(null);
  const [chainId, setChainId] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [showDocument, setShowDocument] = useState(false);

  /**
   * Connect wallet and generate DID
   */
  const handleConnectWallet = async () => {
    setLoading(true);
    try {
      // Get connected address from MetaMask
      const addr = await getConnectedAddress();
      setAddress(addr);

      // Get chain ID
      const chain = await getChainId();
      setChainId(chain);

      // Create DID:PKH
      const didString = createDidPkh(addr, chain);
      setDid(didString);

      // Format DID Document
      const doc = formatDidDocument(didString);
      setDidDocument(doc);

      toast.success('DID created successfully!');
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      toast.error(error.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Copy DID to clipboard
   */
  const handleCopyDid = () => {
    if (!did) return;

    navigator.clipboard.writeText(did).then(() => {
      toast.success('DID copied to clipboard!');
    }).catch((error) => {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy DID');
    });
  };

  /**
   * Copy DID Document to clipboard
   */
  const handleCopyDocument = () => {
    if (!didDocument) return;

    const jsonString = JSON.stringify(didDocument, null, 2);
    navigator.clipboard.writeText(jsonString).then(() => {
      toast.success('DID Document copied to clipboard!');
    }).catch((error) => {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy DID Document');
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">DID Management</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Manage your Decentralized Identifier (DID) using MetaMask
      </p>

      {/* Connect Wallet Section */}
      {!did && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Connect Wallet</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Connect your MetaMask wallet to generate your DID (Decentralized Identifier)
          </p>
          <button
            onClick={handleConnectWallet}
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Connecting...' : 'Connect Wallet & Show DID'}
          </button>
        </div>
      )}

      {/* DID Display Section */}
      {did && (
        <div className="space-y-6">
          {/* Wallet Info */}
          <div className="card bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <h2 className="text-xl font-semibold mb-4">Wallet Connected</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Address:</span>
                <p className="font-mono text-xs break-all mt-1">{address}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Chain ID:</span>
                <p className="mt-1">
                  {chainId} 
                  {chainId === 1 && ' (Ethereum Mainnet)'}
                  {chainId === 11155111 && ' (Sepolia Testnet)'}
                  {chainId === 31337 && ' (Hardhat Local)'}
                </p>
              </div>
            </div>
          </div>

          {/* DID Display */}
          <div className="card">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold">Your DID</h2>
              <button
                onClick={handleCopyDid}
                className="text-sm px-3 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200"
              >
                Copy DID
              </button>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="font-mono text-sm break-all">{did}</p>
            </div>
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              <p className="font-medium mb-2">DID Format:</p>
              <p className="font-mono text-xs">did:pkh:eip155:&lt;chainId&gt;:&lt;address&gt;</p>
              <p className="mt-2">
                This DID is derived from your Ethereum address and can be used for 
                decentralized authentication and verifiable credentials.
              </p>
            </div>
          </div>

          {/* DID Document */}
          <div className="card">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold">DID Document</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDocument(!showDocument)}
                  className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  {showDocument ? 'Hide' : 'Show'}
                </button>
                {showDocument && (
                  <button
                    onClick={handleCopyDocument}
                    className="text-sm px-3 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200"
                  >
                    Copy JSON
                  </button>
                )}
              </div>
            </div>

            {showDocument && didDocument && (
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
                <pre className="text-xs font-mono">
                  {JSON.stringify(didDocument, null, 2)}
                </pre>
              </div>
            )}

            {!showDocument && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Click "Show" to view your DID Document JSON. This document contains 
                your verification methods and authentication capabilities.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-primary-600 font-bold">1.</span>
                <p>
                  Use your DID for authentication with the issuer service to obtain 
                  verifiable credentials.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-primary-600 font-bold">2.</span>
                <p>
                  Upload documents and link them to verifiable credentials issued to your DID.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-primary-600 font-bold">3.</span>
                <p>
                  Share your DID with others to receive credentials or prove your identity.
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={handleConnectWallet}
                className="btn-secondary"
              >
                Refresh DID
              </button>
              <a
                href="/secure-upload"
                className="btn-primary"
              >
                Upload Document
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-8 card bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
        <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
          About DID:PKH
        </h3>
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          DID:PKH (Public Key Hash) is a DID method that derives identifiers from blockchain 
          addresses. Your DID is cryptographically linked to your Ethereum address, allowing 
          you to prove ownership through MetaMask signatures without revealing your private key.
        </p>
      </div>
    </div>
  );
}
