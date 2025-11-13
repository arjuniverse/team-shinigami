import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { retrieveDid } from '../utils/didManager';
import toast from 'react-hot-toast';
import { UserCircleIcon, KeyIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [did, setDid] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const { did: userDid } = retrieveDid();
    if (userDid) {
      setDid(userDid);
    }
  }, [user, navigate]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleExportVault = () => {
    // TODO: Implement vault export
    toast.error('Export feature coming soon');
  };

  const handleImportVault = () => {
    // TODO: Implement vault import
    toast.error('Import feature coming soon');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Profile & Settings
      </h1>

      <div className="space-y-6">
        {/* User Info */}
        <div className="card">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
              <UserCircleIcon className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {user?.displayName || 'User'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* DID Info */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <KeyIcon className="w-5 h-5 mr-2" />
            Your Decentralized Identifier
          </h3>
          {did ? (
            <div className="space-y-3">
              <div className="p-3 bg-gray-100 dark:bg-gray-900 rounded-lg font-mono text-sm break-all">
                {did}
              </div>
              <button
                onClick={() => copyToClipboard(did)}
                className="btn-secondary text-sm"
              >
                <DocumentDuplicateIcon className="w-4 h-4 inline mr-1" />
                Copy DID
              </button>
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No DID found</p>
          )}
        </div>

        {/* Vault Management */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Vault Management
          </h3>
          <div className="space-y-3">
            <button
              onClick={handleExportVault}
              className="w-full btn-secondary py-3"
            >
              Export Vault
            </button>
            <button
              onClick={handleImportVault}
              className="w-full btn-secondary py-3"
            >
              Import Vault
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            Export your encrypted vault to backup your credentials. Import to restore from a backup.
          </p>
        </div>

        {/* Security Warning */}
        <div className="card bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            ⚠️ Security Notice
          </h3>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>• Your private keys are stored locally in your browser</li>
            <li>• Never share your private keys or passphrase</li>
            <li>• Backup your vault regularly</li>
            <li>• Use a strong, unique passphrase</li>
          </ul>
        </div>

        {/* Danger Zone */}
        <div className="card border-red-200 dark:border-red-800">
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
            Danger Zone
          </h3>
          <button
            onClick={async () => {
              if (confirm('Are you sure you want to logout?')) {
                await logout();
                navigate('/');
              }
            }}
            className="btn-secondary text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
