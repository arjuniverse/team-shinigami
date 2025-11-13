import { useState } from 'react';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function Verify() {
  const [vpJson, setVpJson] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  const handleVerify = async () => {
    if (!vpJson.trim()) {
      toast.error('Please paste a verifiable presentation');
      return;
    }

    setVerifying(true);
    setVerificationResult(null);

    try {
      // Parse VP
      const vp = JSON.parse(vpJson);

      // TODO: Replace with real API call to issuer backend
      const issuerApiUrl = import.meta.env.VITE_ISSUER_API_URL || 'http://localhost:8080';
      
      const response = await fetch(`${issuerApiUrl}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presentation: vp }),
      });

      if (!response.ok) {
        throw new Error('Verification failed');
      }

      const result = await response.json();
      setVerificationResult(result);

      if (result.verified) {
        toast.success('Presentation verified successfully!');
      } else {
        toast.error('Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error(error.message || 'Failed to verify presentation');
      setVerificationResult({
        verified: false,
        error: error.message,
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setVpJson(event.target.result);
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Verify Presentation
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Paste or upload a verifiable presentation to verify its authenticity
      </p>

      <div className="card space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Verifiable Presentation JSON
          </label>
          <textarea
            value={vpJson}
            onChange={(e) => setVpJson(e.target.value)}
            className="input-field font-mono text-sm h-64"
            placeholder='Paste VP JSON here...'
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="btn-secondary cursor-pointer">
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
            Upload JSON File
          </label>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            or paste JSON above
          </span>
        </div>

        <button
          onClick={handleVerify}
          disabled={verifying || !vpJson.trim()}
          className="w-full btn-primary py-3 flex items-center justify-center"
        >
          {verifying ? <Loader size="sm" /> : 'Verify Presentation'}
        </button>

        {/* Verification Result */}
        {verificationResult && (
          <div className={`p-6 rounded-lg border ${
            verificationResult.verified
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-start space-x-3">
              {verificationResult.verified ? (
                <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400 flex-shrink-0" />
              ) : (
                <XCircleIcon className="w-8 h-8 text-red-600 dark:text-red-400 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {verificationResult.verified ? 'Verification Successful' : 'Verification Failed'}
                </h3>
                
                {verificationResult.verified ? (
                  <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <p><span className="font-medium">Holder:</span> {verificationResult.holder || 'N/A'}</p>
                    <p><span className="font-medium">Credentials:</span> {verificationResult.credentialCount || 0}</p>
                    <p><span className="font-medium">Status:</span> Valid</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {verificationResult.error || 'The presentation could not be verified'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 card bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          ℹ️ About Verification
        </h3>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Verification checks the cryptographic signatures, issuer validity, and revocation status 
          of the credentials in the presentation. A successful verification means the credentials 
          are authentic and have not been tampered with.
        </p>
      </div>
    </div>
  );
}
