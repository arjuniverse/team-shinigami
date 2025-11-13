import { useState } from 'react';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';

export default function Retrieve() {
  const [cid, setCid] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileData, setFileData] = useState(null);

  const handleRetrieve = async () => {
    if (!cid) {
      toast.error('Please enter a CID or storage key');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement actual retrieval from R2
      const issuerApiUrl = import.meta.env.VITE_ISSUER_API_URL || 'http://localhost:8080';
      
      const response = await fetch(`${issuerApiUrl}/retrieve/${cid}`);
      
      if (!response.ok) {
        throw new Error('File not found');
      }

      const blob = await response.blob();
      setFileData({
        blob,
        url: URL.createObjectURL(blob),
        cid,
      });

      toast.success('File retrieved successfully');
    } catch (error) {
      console.error('Retrieval failed:', error);
      toast.error(error.message || 'Failed to retrieve file');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!fileData) return;

    const a = document.createElement('a');
    a.href = fileData.url;
    a.download = `retrieved-${fileData.cid}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Download started');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Retrieve Document
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Enter a CID or storage key to retrieve your encrypted document
      </p>

      <div className="card space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            CID or Storage Key
          </label>
          <input
            type="text"
            value={cid}
            onChange={(e) => setCid(e.target.value)}
            className="input-field"
            placeholder="Enter CID or storage key"
          />
        </div>

        <button
          onClick={handleRetrieve}
          disabled={loading || !cid}
          className="w-full btn-primary py-3 flex items-center justify-center"
        >
          {loading ? <Loader size="sm" /> : 'Retrieve File'}
        </button>

        {fileData && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              File Retrieved
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              CID: {fileData.cid}
            </p>
            <button
              onClick={handleDownload}
              className="btn-primary"
            >
              Download File
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 card bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          💡 Tip
        </h3>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          You can find storage keys in your vault credentials. If the file is encrypted, 
          you'll need the encryption key and IV to decrypt it.
        </p>
      </div>
    </div>
  );
}
