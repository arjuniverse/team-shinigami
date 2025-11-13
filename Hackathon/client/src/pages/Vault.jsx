import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { retrieveVCs } from '../utils/cryptoVault';
import { signPresentation } from '../utils/didManager';
import CredentialCard from '../components/CredentialCard';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import { SkeletonCard } from '../components/Skeleton';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';

export default function Vault() {
  const { user, userDid } = useAuth();
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [showPassphraseModal, setShowPassphraseModal] = useState(true);
  const [selectedCredentials, setSelectedCredentials] = useState([]);
  const [showPresentationModal, setShowPresentationModal] = useState(false);
  const [presentation, setPresentation] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleUnlock = async () => {
    if (!passphrase) {
      toast.error('Please enter your passphrase');
      return;
    }

    setLoading(true);
    try {
      const vcs = await retrieveVCs(passphrase);
      setCredentials(vcs);
      setShowPassphraseModal(false);
      toast.success(`Loaded ${vcs.length} credential(s)`);
    } catch (error) {
      console.error('Failed to unlock vault:', error);
      toast.error(error.message || 'Failed to unlock vault');
    } finally {
      setLoading(false);
    }
  };

  const toggleCredentialSelection = (credential) => {
    setSelectedCredentials(prev => {
      const isSelected = prev.some(c => c.id === credential.id);
      if (isSelected) {
        return prev.filter(c => c.id !== credential.id);
      } else {
        return [...prev, credential];
      }
    });
  };

  const handleCreatePresentation = async () => {
    if (selectedCredentials.length === 0) {
      toast.error('Please select at least one credential');
      return;
    }

    try {
      // Create unsigned VP
      const vp = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiablePresentation'],
        holder: userDid,
        verifiableCredential: selectedCredentials,
      };

      // Sign the presentation
      const { privateKey } = JSON.parse(localStorage.getItem('did_vault_private_key')) || {};
      if (!privateKey) {
        throw new Error('Private key not found');
      }

      const signedVP = await signPresentation(vp, privateKey);
      setPresentation(signedVP);

      // Generate QR code
      const qrUrl = await QRCode.toDataURL(JSON.stringify(signedVP));
      setQrCodeUrl(qrUrl);

      setShowPresentationModal(true);
      toast.success('Presentation created successfully');
    } catch (error) {
      console.error('Failed to create presentation:', error);
      toast.error(error.message || 'Failed to create presentation');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (showPassphraseModal) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full card">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Unlock Your Vault
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Enter your passphrase to decrypt and view your credentials
          </p>
          <input
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
            className="input-field mb-4"
            placeholder="Enter passphrase"
            autoFocus
          />
          <button
            onClick={handleUnlock}
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center"
          >
            {loading ? <Loader size="sm" /> : 'Unlock Vault'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Your Vault
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {credentials.length} credential(s) stored
          </p>
        </div>
        {selectedCredentials.length > 0 && (
          <button
            onClick={handleCreatePresentation}
            className="btn-primary"
          >
            Create Presentation ({selectedCredentials.length})
          </button>
        )}
      </div>

      {credentials.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No credentials found. Upload a document to get started.
          </p>
          <button
            onClick={() => navigate('/upload')}
            className="btn-primary"
          >
            Upload Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {credentials.map((credential) => (
            <CredentialCard
              key={credential.id}
              credential={credential}
              isSelected={selectedCredentials.some(c => c.id === credential.id)}
              onSelect={toggleCredentialSelection}
            />
          ))}
        </div>
      )}

      {/* Presentation Modal */}
      <Modal
        isOpen={showPresentationModal}
        onClose={() => setShowPresentationModal(false)}
        title="Verifiable Presentation"
        size="lg"
      >
        <div className="space-y-4">
          {qrCodeUrl && (
            <div className="flex justify-center">
              <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Presentation JSON
            </label>
            <textarea
              readOnly
              value={JSON.stringify(presentation, null, 2)}
              className="input-field font-mono text-xs h-64"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => copyToClipboard(JSON.stringify(presentation))}
              className="flex-1 btn-primary"
            >
              Copy JSON
            </button>
            <button
              onClick={() => setShowPresentationModal(false)}
              className="flex-1 btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
