import { useState } from 'react';
import { 
  DocumentTextIcon, 
  EyeIcon, 
  ShareIcon, 
  TrashIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';
import Modal from './Modal';

export default function CredentialCard({ credential, onView, onShare, onDelete, isSelected, onSelect }) {
  const [showDetails, setShowDetails] = useState(false);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCredentialType = () => {
    if (Array.isArray(credential.type)) {
      return credential.type.find(t => t !== 'VerifiableCredential') || 'Credential';
    }
    return credential.type || 'Credential';
  };

  const getIssuerName = () => {
    if (typeof credential.issuer === 'string') {
      return credential.issuer.split(':').pop().substring(0, 8) + '...';
    }
    return credential.issuer?.id?.split(':').pop().substring(0, 8) + '...' || 'Unknown';
  };

  return (
    <>
      <div 
        className={`card-hover relative ${isSelected ? 'ring-2 ring-primary-500' : ''}`}
        onClick={() => onSelect && onSelect(credential)}
      >
        {/* Selection indicator */}
        {onSelect && (
          <div className="absolute top-4 right-4">
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              isSelected 
                ? 'bg-primary-600 border-primary-600' 
                : 'border-gray-300 dark:border-gray-600'
            }`}>
              {isSelected && <CheckCircleIcon className="w-5 h-5 text-white" />}
            </div>
          </div>
        )}

        {/* Icon */}
        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center mb-4">
          <DocumentTextIcon className="w-6 h-6 text-white" />
        </div>

        {/* Content */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {getCredentialType()}
        </h3>

        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400 mb-4">
          <p>
            <span className="font-medium">Issuer:</span> {getIssuerName()}
          </p>
          {credential.issuanceDate && (
            <p>
              <span className="font-medium">Issued:</span> {formatDate(credential.issuanceDate)}
            </p>
          )}
          {credential._metadata?.storedAt && (
            <p>
              <span className="font-medium">Stored:</span> {formatDate(credential._metadata.storedAt)}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(true);
            }}
            className="flex-1 btn-secondary text-sm py-2"
            aria-label="View details"
          >
            <EyeIcon className="w-4 h-4 inline mr-1" />
            View
          </button>
          {onShare && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare(credential);
              }}
              className="flex-1 btn-primary text-sm py-2"
              aria-label="Share credential"
            >
              <ShareIcon className="w-4 h-4 inline mr-1" />
              Share
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(credential);
              }}
              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              aria-label="Delete credential"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title="Credential Details"
        size="lg"
      >
        <div className="max-h-96 overflow-y-auto">
          <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto">
            {JSON.stringify(credential, null, 2)}
          </pre>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setShowDetails(false)}
            className="btn-secondary"
          >
            Close
          </button>
        </div>
      </Modal>
    </>
  );
}
