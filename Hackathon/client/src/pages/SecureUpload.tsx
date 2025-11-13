/**
 * Secure Document Upload Page
 * Implements: Encryption → Hash → Upload → Metadata → Blockchain
 */

import { useState } from 'react';
import { sha256Hex, deriveKey, encryptBlob, generateSalt } from '../lib/crypto';
import { uploadToLighthouse } from '../lib/lighthouse';
import { storeHashOnChain, connectWallet, getCurrentAccount } from '../lib/blockchain';
import { createMetadata, updateTxHash } from '../lib/metadata';
import { saveLocalMetadata } from '../lib/localMetadata';
import { getStorageInfo, clearOldMockFiles } from '../lib/mockStorage';
import toast from 'react-hot-toast';

export default function SecureUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [originalHash, setOriginalHash] = useState('');
  const [encryptedHash, setEncryptedHash] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  
  // Progress states
  type UploadStep = 'select' | 'hash' | 'encrypt' | 'upload' | 'metadata' | 'blockchain' | 'complete';
  const [step, setStep] = useState<UploadStep>('select');
  const [loading, setLoading] = useState(false);
  
  // Results
  const [cid, setCid] = useState('');
  const [gatewayUrl, setGatewayUrl] = useState('');
  const [metadataId, setMetadataId] = useState('');
  const [txHash, setTxHash] = useState('');

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setStep('hash');
    
    // Compute SHA-256 of original file
    toast.loading('Computing SHA-256 hash...');
    try {
      const hash = await sha256Hex(selectedFile);
      setOriginalHash(hash);
      toast.success('Hash computed');
    } catch (error: any) {
      toast.error(`Hash failed: ${error.message}`);
      setStep('select');
    }
  };

  // Handle encryption and upload
  const handleEncryptAndUpload = async () => {
    if (!file || !password || !originalHash) {
      toast.error('Missing required data');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Encrypt file
      setStep('encrypt');
      toast.loading('Encrypting file...');
      
      const salt = generateSalt();
      const key = await deriveKey(password, salt);
      const { cipherBlob, iv } = await encryptBlob(file, key);
      
      // Optionally compute encrypted hash
      const encHash = await sha256Hex(cipherBlob);
      setEncryptedHash(encHash);
      
      toast.success('File encrypted');

      // Step 2: Upload to Lighthouse
      setStep('upload');
      toast.loading('Uploading to Lighthouse...');
      
      // Use uploadViaBackend for production (keeps API key secure)
      // Or uploadToLighthouse for development (requires VITE_LIGHTHOUSE_API_KEY)
      const { cid: uploadedCid, gatewayUrl: url } = await uploadToLighthouse(
        cipherBlob,
        `encrypted_${file.name}`
      );
      
      setCid(uploadedCid);
      setGatewayUrl(url);
      toast.success('Uploaded to IPFS');

      // Step 3: Get wallet address (optional for now, required for blockchain step)
      let address = walletAddress;
      if (!address) {
        try {
          address = await getCurrentAccount() || '';
          if (address) {
            setWalletAddress(address);
          }
        } catch (error) {
          console.log('Wallet not connected yet, will prompt during blockchain step');
        }
      }
      
      // Use a placeholder address if wallet not connected yet
      if (!address) {
        address = '0x0000000000000000000000000000000000000000';
        console.log('Using placeholder address, will update when storing on blockchain');
      }

      // Step 4: Save metadata (try backend first, fallback to local)
      setStep('metadata');
      
      let savedId = '';
      try {
        toast.loading('Saving metadata...');
        
        const metadata = await createMetadata({
          filename: file.name,
          cid: uploadedCid,
          sha256: originalHash,
          encryptedSize: cipherBlob.size,
          ownerAddress: address,
          iv: Array.from(iv),
          salt: Array.from(salt),
        });
        
        savedId = metadata.id;
        toast.success('Metadata saved to backend');
      } catch (error: any) {
        console.warn('Backend not available, saving locally:', error);
        
        // Save locally as fallback
        savedId = `local-${Date.now()}`;
        saveLocalMetadata({
          id: savedId,
          filename: file.name,
          cid: uploadedCid,
          sha256: originalHash,
          encryptedSize: cipherBlob.size,
          timestamp: new Date().toISOString(),
          ownerAddress: address,
          iv: Array.from(iv),
          salt: Array.from(salt),
        });
        
        toast.success('Metadata saved locally (backend offline)');
      }
      
      setMetadataId(savedId);
      setStep('blockchain');
      setLoading(false);
      
    } catch (error: any) {
      console.error('Upload process error:', error);
      
      // Handle storage quota errors
      if (error.message?.includes('quota exceeded') || error.message?.includes('Storage quota')) {
        const storageInfo = getStorageInfo();
        const usedMB = (storageInfo.used / (1024 * 1024)).toFixed(2);
        
        toast.error(
          `Storage full! Using ${usedMB}MB. Try clearing old files.`,
          { duration: 5000 }
        );
        
        // Offer to clear old files
        if (confirm(`localStorage is full (${usedMB}MB used). Clear old files and try again?`)) {
          const cleared = clearOldMockFiles(3); // Keep only 3 most recent
          toast.success(`Cleared ${cleared} old files. Please try uploading again.`);
          setStep('hash'); // Reset to allow retry
        }
      } else {
        toast.error(error.message || 'Upload failed');
      }
      
      setLoading(false);
    }
  };

  // Handle blockchain anchoring
  const handleStoreOnChain = async () => {
    if (!originalHash || !metadataId) {
      toast.error('Missing hash or metadata ID');
      return;
    }

    setLoading(true);

    try {
      // Connect wallet if not already connected
      if (!walletAddress || walletAddress === '0x0000000000000000000000000000000000000000') {
        toast.loading('Connecting wallet...');
        const address = await connectWallet();
        setWalletAddress(address);
        toast.success('Wallet connected');
      }
      
      toast.loading('Storing hash on blockchain...');
      
      const tx = await storeHashOnChain(originalHash);
      setTxHash(tx);
      
      toast.success('Hash stored on blockchain');

      // Update metadata with txHash
      await updateTxHash(metadataId, tx);
      
      setStep('complete');
    } catch (error: any) {
      console.error('Blockchain error:', error);
      
      if (error.message.includes('MetaMask')) {
        toast.error('Please install MetaMask browser extension to use blockchain features');
      } else {
        toast.error(error.message || 'Blockchain operation failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setFile(null);
    setPassword('');
    setOriginalHash('');
    setEncryptedHash('');
    setCid('');
    setGatewayUrl('');
    setMetadataId('');
    setTxHash('');
    setStep('select');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Secure Document Upload</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Encrypt, upload, and anchor your document on the blockchain
      </p>

      {/* Step 1: File Selection */}
      {step === 'select' && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">1. Select File</h2>
          <input
            type="file"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
        </div>
      )}

      {/* Step 2: Show Hash & Encryption */}
      {file && step !== 'select' && step !== 'complete' && (
        <div className="space-y-6">
          <div className="card bg-green-50 dark:bg-green-900/20">
            <h2 className="text-xl font-semibold mb-4">File Selected</h2>
            <p className="text-sm"><strong>Name:</strong> {file.name}</p>
            <p className="text-sm"><strong>Size:</strong> {(file.size / 1024).toFixed(2)} KB</p>
            <p className="text-sm break-all"><strong>SHA-256:</strong> {originalHash}</p>
          </div>

          {step === 'hash' && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">2. Enter Password</h2>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter encryption password"
                className="input-field mb-4"
              />
              <button
                onClick={handleEncryptAndUpload}
                disabled={!password || loading}
                className="btn-primary w-full"
              >
                {loading ? 'Processing...' : 'Encrypt & Upload'}
              </button>
            </div>
          )}

          {(step === 'encrypt' || step === 'upload' || step === 'metadata') && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Processing...</h2>
              <div className="space-y-2 text-sm">
                <p className="flex items-center">
                  <span className={step === 'encrypt' ? 'text-blue-600' : 'text-green-600'}>
                    {step === 'encrypt' ? '⏳' : '✅'} Encrypting file
                  </span>
                </p>
                <p className="flex items-center">
                  <span className={
                    step === 'upload' ? 'text-blue-600' : 
                    ['metadata', 'blockchain', 'complete'].includes(step) ? 'text-green-600' : 
                    'text-gray-400'
                  }>
                    {step === 'upload' ? '⏳' : 
                     ['metadata', 'blockchain', 'complete'].includes(step) ? '✅' : 
                     '⏸️'} Uploading to Lighthouse
                  </span>
                </p>
                <p className="flex items-center">
                  <span className={
                    step === 'metadata' ? 'text-blue-600' : 
                    ['blockchain', 'complete'].includes(step) ? 'text-green-600' : 
                    'text-gray-400'
                  }>
                    {step === 'metadata' ? '⏳' : 
                     ['blockchain', 'complete'].includes(step) ? '✅' : 
                     '⏸️'} Saving metadata
                  </span>
                </p>
              </div>
            </div>
          )}

          {step === 'blockchain' && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">3. Store on Blockchain</h2>
              <p className="text-sm mb-4">
                <strong>CID:</strong> <a href={gatewayUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{cid}</a>
              </p>
              <p className="text-sm mb-4 break-all">
                <strong>Encrypted Hash:</strong> {encryptedHash}
              </p>
              
              {!window.ethereum && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ MetaMask not detected. Please install MetaMask to store hash on blockchain.
                    <a 
                      href="https://metamask.io/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline ml-1"
                    >
                      Install MetaMask
                    </a>
                  </p>
                </div>
              )}
              
              <button
                onClick={handleStoreOnChain}
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Storing...' : 'Store Hash on Blockchain'}
              </button>
              
              <button
                onClick={() => {
                  setStep('complete');
                  toast.success('Upload complete! You can store on blockchain later.');
                }}
                className="btn-secondary w-full mt-2"
              >
                Skip Blockchain (Complete Upload)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Complete */}
      {step === 'complete' && (
        <div className="card bg-primary-50 dark:bg-primary-900/20">
          <h2 className="text-2xl font-bold mb-4 text-green-600">✅ Upload Complete!</h2>
          <div className="space-y-3 text-sm">
            <p><strong>File:</strong> {file?.name}</p>
            <p className="break-all"><strong>SHA-256:</strong> {originalHash}</p>
            <p><strong>CID:</strong> <a href={gatewayUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{cid}</a></p>
            <p className="break-all"><strong>Transaction:</strong> <span className="text-green-600">{txHash}</span></p>
            <p><strong>Metadata ID:</strong> {metadataId}</p>
          </div>
          <div className="mt-6 flex gap-4">
            <button onClick={handleReset} className="btn-primary">Upload Another</button>
            <a href="/secure-files" className="btn-primary">View Files</a>
          </div>
        </div>
      )}
    </div>
  );
}
