import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import FileDropzone from '../components/FileDropzone';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';
import { encryptFile, uploadToR2, buildClaimsFromUpload } from '../utils/r2Upload';
import { encryptVC, storeVC } from '../utils/cryptoVault';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

export default function Upload() {
  const { user, userDid } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [passphrase, setPassphrase] = useState('');
  const [docType, setDocType] = useState('document');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [requestingVC, setRequestingVC] = useState(false);
  const [vcResult, setVcResult] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    if (!passphrase) {
      toast.error('Please enter a passphrase for encryption');
      return;
    }

    setUploading(true);
    try {
      // Encrypt file client-side
      toast.loading('Encrypting file...');
      const { encrypted, key, iv, fileName } = await encryptFile(file);

      // Upload to R2
      toast.loading('Uploading to storage...');
      const uploadData = await uploadToR2(encrypted, fileName);

      setUploadResult({
        ...uploadData,
        encryptionKey: key,
        iv,
        fileName,
      });

      toast.success('File uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRequestCredential = async () => {
    if (!uploadResult || !userDid) {
      toast.error('Missing required data');
      return;
    }

    setRequestingVC(true);
    try {
      // Build claims
      const claims = buildClaimsFromUpload(uploadResult.storageKey, docType, {
        fileName: uploadResult.fileName,
        encryptionKey: uploadResult.encryptionKey,
        iv: uploadResult.iv,
      });

      // TODO: Replace with real API call
      const issuerApiUrl = import.meta.env.VITE_ISSUER_API_URL || 'http://localhost:8080';
      
      const response = await fetch(`${issuerApiUrl}/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectDid: userDid,
          claims,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to issue credential');
      }

      const vc = await response.json();

      // Encrypt and store VC locally
      const encryptedVC = await encryptVC(vc, passphrase);
      storeVC(vc.id, encryptedVC);

      setVcResult(vc);
      toast.success('Credential issued and stored!');
    } catch (error) {
      console.error('Failed to request credential:', error);
      toast.error(error.message || 'Failed to request credential');
    } finally {
      setRequestingVC(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Upload Document
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Upload and encrypt your document, then request a verifiable credential
      </p>

      <div className="space-y-6">
        {/* File Upload */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            1. Select File
          </h2>
          <FileDropzone onFileSelect={setFile} />
        </div>

        {/* Encryption Settings */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            2. Encryption Settings
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Passphrase (for vault encryption)
              </label>
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                className="input-field"
                placeholder="Enter a strong passphrase"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                This passphrase will be used to encrypt your credential in the vault
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Document Type
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="input-field"
              >
                <option value="document">General Document</option>
                <option value="passport">Passport</option>
                <option value="license">License</option>
                <option value="certificate">Certificate</option>
                <option value="diploma">Diploma</option>
              </select>
            </div>
          </div>
        </div>

        {/* Upload Button */}
        {!uploadResult && (
          <button
            onClick={handleUpload}
            disabled={!file || !passphrase || uploading}
            className="w-full btn-primary py-3 flex items-center justify-center"
          >
            {uploading ? <Loader size="sm" /> : 'Encrypt & Upload'}
          </button>
        )}

        {/* Upload Result */}
        {uploadResult && !vcResult && (
          <div className="card bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <div className="flex items-start space-x-3">
              <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Upload Successful
                </h3>
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  <p><span className="font-medium">Storage Key:</span> {uploadResult.storageKey}</p>
                  <p><span className="font-medium">File:</span> {uploadResult.fileName}</p>
                </div>
                <button
                  onClick={handleRequestCredential}
                  disabled={requestingVC}
                  className="mt-4 btn-primary flex items-center"
                >
                  {requestingVC ? <Loader size="sm" /> : 'Request Credential'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VC Result */}
        {vcResult && (
          <div className="card bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
            <div className="flex items-start space-x-3">
              <CheckCircleIcon className="w-6 h-6 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Credential Issued!
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                  Your verifiable credential has been issued and stored in your vault.
                </p>
                <button
                  onClick={() => navigate('/vault')}
                  className="btn-primary"
                >
                  View in Vault
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
