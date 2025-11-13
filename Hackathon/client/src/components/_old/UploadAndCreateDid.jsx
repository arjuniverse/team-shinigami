import React, { useState, useEffect } from 'react';
import { encryptFile, uploadToR2, buildClaimsFromUpload } from '../utils/r2Upload';
import { generateDidKey, storeDid, retrieveDid } from '../utils/didManager';
import { encryptVC, storeVC } from '../utils/cryptoVault';

function UploadAndCreateDid() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const [did, setDid] = useState(null);
  const [generatingDid, setGeneratingDid] = useState(false);
  const [didError, setDidError] = useState(null);

  const [requestingVC, setRequestingVC] = useState(false);
  const [vcResult, setVcResult] = useState(null);
  const [vcError, setVcError] = useState(null);
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrasePrompt, setShowPassphrasePrompt] = useState(false);

  const [docType, setDocType] = useState('document');

  // Load existing DID on component mount
  useEffect(() => {
    const { did: storedDid } = retrieveDid();
    if (storedDid) {
      setDid(storedDid);
    }
  }, []);

  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult(null);
      setUploadError(null);
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadResult(null);

    try {
      // Encrypt the file
      const { encrypted, key, iv, fileName } = await encryptFile(selectedFile);

      // Upload to R2
      const result = await uploadToR2(encrypted, fileName);

      setUploadResult({
        ...result,
        encryptionKey: key,
        iv: iv,
        fileName: fileName
      });
    } catch (error) {
      setUploadError(error.message);
    } finally {
      setUploading(false);
    }
  };

  // Handle DID generation
  const handleGenerateDid = async () => {
    setGeneratingDid(true);
    setDidError(null);

    try {
      const { did: newDid, privateKey } = await generateDidKey();
      storeDid(newDid, privateKey);
      setDid(newDid);
    } catch (error) {
      setDidError(error.message);
    } finally {
      setGeneratingDid(false);
    }
  };

  // Handle VC request
  const handleRequestVC = async () => {
    if (!did) {
      setVcError('Please generate a DID first');
      return;
    }

    if (!uploadResult) {
      setVcError('Please upload a file first');
      return;
    }

    setShowPassphrasePrompt(true);
  };

  // Handle VC request with passphrase
  const handleRequestVCWithPassphrase = async () => {
    if (!passphrase) {
      setVcError('Please enter a passphrase to encrypt your credential');
      return;
    }

    setRequestingVC(true);
    setVcError(null);
    setVcResult(null);

    try {
      // Build claims from upload
      const claims = buildClaimsFromUpload(uploadResult.storageKey, docType, {
        fileName: uploadResult.fileName,
        encryptionKey: uploadResult.encryptionKey,
        iv: uploadResult.iv
      });

      // Request VC from issuer
      const issuerApiUrl = import.meta.env.VITE_ISSUER_API_URL || 'http://localhost:8080';
      const response = await fetch(`${issuerApiUrl}/issue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subjectDid: did,
          claims: claims
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to issue credential' }));
        throw new Error(errorData.error || `Failed to issue credential: ${response.status}`);
      }

      const { vc } = await response.json();

      // Encrypt and store the VC
      const encryptedData = await encryptVC(vc, passphrase);
      const vcId = vc.id || vc.credentialSubject?.id || `vc-${Date.now()}`;
      storeVC(vcId, encryptedData);

      setVcResult({
        vcId,
        vc
      });
      setShowPassphrasePrompt(false);
      setPassphrase('');
    } catch (error) {
      setVcError(error.message);
    } finally {
      setRequestingVC(false);
    }
  };

  return (
    <div>
      <h2>Upload & Create DID</h2>
      <p>Upload encrypted files and create your decentralized identifier.</p>

      {/* File Upload Section */}
      <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h3>Step 1: Upload File</h3>
        <div style={{ marginTop: '15px' }}>
          <input
            type="file"
            onChange={handleFileChange}
            style={{ marginRight: '10px' }}
          />
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            style={{
              padding: '10px 20px',
              backgroundColor: uploading ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: uploading ? 'not-allowed' : 'pointer'
            }}
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>

        {uploadResult && (
          <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#d4edda', borderRadius: '5px' }}>
            <strong>✓ Upload Successful!</strong>
            <p style={{ margin: '5px 0' }}>Storage Key: <code>{uploadResult.storageKey}</code></p>
            <p style={{ margin: '5px 0' }}>Bucket: {uploadResult.bucket}</p>
            <p style={{ margin: '5px 0' }}>Timestamp: {uploadResult.timestamp}</p>
          </div>
        )}

        {uploadError && (
          <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f8d7da', borderRadius: '5px', color: '#721c24' }}>
            <strong>✗ Upload Failed:</strong> {uploadError}
          </div>
        )}
      </div>

      {/* DID Generation Section */}
      <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h3>Step 2: Generate DID</h3>
        {did ? (
          <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#d4edda', borderRadius: '5px' }}>
            <strong>✓ DID Generated:</strong>
            <p style={{ margin: '5px 0', wordBreak: 'break-all' }}><code>{did}</code></p>
          </div>
        ) : (
          <div style={{ marginTop: '15px' }}>
            <button
              onClick={handleGenerateDid}
              disabled={generatingDid}
              style={{
                padding: '10px 20px',
                backgroundColor: generatingDid ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: generatingDid ? 'not-allowed' : 'pointer'
              }}
            >
              {generatingDid ? 'Generating...' : 'Generate DID'}
            </button>
          </div>
        )}

        {didError && (
          <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f8d7da', borderRadius: '5px', color: '#721c24' }}>
            <strong>✗ DID Generation Failed:</strong> {didError}
          </div>
        )}
      </div>

      {/* VC Request Section */}
      <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h3>Step 3: Request Verifiable Credential</h3>
        <div style={{ marginTop: '15px' }}>
          <label style={{ display: 'block', marginBottom: '10px' }}>
            Document Type:
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              style={{ marginLeft: '10px', padding: '5px' }}
            >
              <option value="document">Document</option>
              <option value="passport">Passport</option>
              <option value="license">License</option>
              <option value="certificate">Certificate</option>
              <option value="other">Other</option>
            </select>
          </label>

          <button
            onClick={handleRequestVC}
            disabled={!did || !uploadResult || requestingVC}
            style={{
              padding: '10px 20px',
              backgroundColor: (!did || !uploadResult || requestingVC) ? '#ccc' : '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: (!did || !uploadResult || requestingVC) ? 'not-allowed' : 'pointer'
            }}
          >
            Request Credential
          </button>
        </div>

        {showPassphrasePrompt && (
          <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
            <h4>Enter Vault Passphrase</h4>
            <p style={{ fontSize: '14px', color: '#856404' }}>
              This passphrase will be used to encrypt your credential in the vault.
              Remember it - you'll need it to access your credentials later.
            </p>
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Enter passphrase"
              style={{
                padding: '10px',
                width: '300px',
                marginRight: '10px',
                border: '1px solid #ccc',
                borderRadius: '5px'
              }}
            />
            <button
              onClick={handleRequestVCWithPassphrase}
              disabled={requestingVC}
              style={{
                padding: '10px 20px',
                backgroundColor: requestingVC ? '#ccc' : '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: requestingVC ? 'not-allowed' : 'pointer'
              }}
            >
              {requestingVC ? 'Requesting...' : 'Confirm & Request'}
            </button>
            <button
              onClick={() => {
                setShowPassphrasePrompt(false);
                setPassphrase('');
              }}
              disabled={requestingVC}
              style={{
                padding: '10px 20px',
                backgroundColor: 'white',
                color: '#333',
                border: '1px solid #ccc',
                borderRadius: '5px',
                marginLeft: '10px',
                cursor: requestingVC ? 'not-allowed' : 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {vcResult && (
          <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#d4edda', borderRadius: '5px' }}>
            <strong>✓ Credential Received and Stored!</strong>
            <p style={{ margin: '5px 0' }}>Credential ID: <code>{vcResult.vcId}</code></p>
            <p style={{ margin: '5px 0', fontSize: '14px' }}>
              Your credential has been encrypted and stored in your vault.
            </p>
            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>View Credential Details</summary>
              <pre style={{
                marginTop: '10px',
                padding: '10px',
                backgroundColor: '#f8f9fa',
                borderRadius: '5px',
                overflow: 'auto',
                fontSize: '12px'
              }}>
                {JSON.stringify(vcResult.vc, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {vcError && (
          <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f8d7da', borderRadius: '5px', color: '#721c24' }}>
            <strong>✗ Credential Request Failed:</strong> {vcError}
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadAndCreateDid;
