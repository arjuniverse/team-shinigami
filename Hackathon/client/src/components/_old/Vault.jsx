import { useState } from 'react';
import { retrieveVCs } from '../utils/cryptoVault';
import { retrieveDid, signPresentation } from '../utils/didManager';

function Vault() {
  const [passphrase, setPassphrase] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState(null);

  const [vcs, setVcs] = useState([]);
  const [selectedVcIds, setSelectedVcIds] = useState(new Set());

  const [creatingVP, setCreatingVP] = useState(false);
  const [vp, setVp] = useState(null);
  const [vpError, setVpError] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Handle vault unlock
  const handleUnlock = async () => {
    if (!passphrase) {
      setUnlockError('Please enter your vault passphrase');
      return;
    }

    setUnlocking(true);
    setUnlockError(null);

    try {
      // Retrieve and decrypt all VCs
      const decryptedVCs = await retrieveVCs(passphrase);
      setVcs(decryptedVCs);
      setIsUnlocked(true);
      setSelectedVcIds(new Set());
    } catch (error) {
      setUnlockError(error.message);
      setIsUnlocked(false);
    } finally {
      setUnlocking(false);
    }
  };

  // Handle VC selection toggle
  const handleVcToggle = (vcId) => {
    const newSelected = new Set(selectedVcIds);
    if (newSelected.has(vcId)) {
      newSelected.delete(vcId);
    } else {
      newSelected.add(vcId);
    }
    setSelectedVcIds(newSelected);
  };

  // Handle VP creation
  const handleCreateVP = async () => {
    if (selectedVcIds.size === 0) {
      setVpError('Please select at least one credential to create a presentation');
      return;
    }

    setCreatingVP(true);
    setVpError(null);
    setVp(null);

    try {
      // Get holder's DID
      const { did, privateKey } = retrieveDid();
      if (!did || !privateKey) {
        throw new Error('No DID found. Please generate a DID first in the Upload & Create DID section.');
      }

      // Get selected VCs
      const selectedVCs = vcs.filter(vc => {
        const vcId = vc._metadata?.vcId || vc.id || vc.credentialSubject?.id;
        return selectedVcIds.has(vcId);
      });

      // Remove metadata before including in VP
      const cleanVCs = selectedVCs.map(vc => {
        const { _metadata, ...cleanVC } = vc;
        return cleanVC;
      });

      // Create unsigned VP
      const unsignedVP = {
        '@context': [
          'https://www.w3.org/2018/credentials/v1'
        ],
        type: ['VerifiablePresentation'],
        holder: did,
        verifiableCredential: cleanVCs
      };

      // Sign the VP with holder's DID
      const signedVP = await signPresentation(unsignedVP, privateKey);

      setVp(signedVP);
      setCopySuccess(false);
    } catch (error) {
      setVpError(error.message);
    } finally {
      setCreatingVP(false);
    }
  };

  // Handle copy to clipboard
  const handleCopyToClipboard = async () => {
    if (!vp) return;

    try {
      const vpString = JSON.stringify(vp, null, 2);
      await navigator.clipboard.writeText(vpString);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = JSON.stringify(vp, null, 2);
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
      } catch (err) {
        console.error('Fallback copy failed:', err);
      }
      document.body.removeChild(textArea);
    }
  };

  // Handle lock vault
  const handleLock = () => {
    setIsUnlocked(false);
    setPassphrase('');
    setVcs([]);
    setSelectedVcIds(new Set());
    setVp(null);
    setVpError(null);
    setUnlockError(null);
  };

  return (
    <div>
      <h2>Credential Vault</h2>
      <p>Manage your stored verifiable credentials and create presentations.</p>

      {!isUnlocked ? (
        // Unlock vault section
        <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <h3>Unlock Vault</h3>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Enter your passphrase to decrypt and view your stored credentials.
          </p>
          <div style={{ marginTop: '15px' }}>
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
              placeholder="Enter vault passphrase"
              style={{
                padding: '10px',
                width: '300px',
                marginRight: '10px',
                border: '1px solid #ccc',
                borderRadius: '5px'
              }}
            />
            <button
              onClick={handleUnlock}
              disabled={unlocking}
              style={{
                padding: '10px 20px',
                backgroundColor: unlocking ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: unlocking ? 'not-allowed' : 'pointer'
              }}
            >
              {unlocking ? 'Unlocking...' : 'Unlock Vault'}
            </button>
          </div>

          {unlockError && (
            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f8d7da', borderRadius: '5px', color: '#721c24' }}>
              <strong>✗ Unlock Failed:</strong> {unlockError}
            </div>
          )}
        </div>
      ) : (
        // Vault unlocked - show credentials
        <>
          <div style={{ marginTop: '20px', marginBottom: '20px' }}>
            <button
              onClick={handleLock}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              🔒 Lock Vault
            </button>
          </div>

          {/* Credentials list */}
          <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
            <h3>Stored Credentials ({vcs.length})</h3>
            
            {vcs.length === 0 ? (
              <p style={{ color: '#666', fontStyle: 'italic' }}>
                No credentials found in your vault. Upload a file and request a credential to get started.
              </p>
            ) : (
              <>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                  Select credentials to include in a verifiable presentation.
                </p>
                
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {vcs.map((vc, index) => {
                    const vcId = vc._metadata?.vcId || vc.id || vc.credentialSubject?.id || `vc-${index}`;
                    const isSelected = selectedVcIds.has(vcId);
                    
                    return (
                      <div
                        key={vcId}
                        style={{
                          padding: '15px',
                          marginBottom: '10px',
                          border: isSelected ? '2px solid #007bff' : '1px solid #ddd',
                          borderRadius: '5px',
                          backgroundColor: isSelected ? '#e7f3ff' : 'white',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleVcToggle(vcId)}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleVcToggle(vcId)}
                            style={{ marginRight: '10px', marginTop: '3px', cursor: 'pointer' }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                              {vc.type?.filter(t => t !== 'VerifiableCredential').join(', ') || 'Verifiable Credential'}
                            </div>
                            <div style={{ fontSize: '13px', color: '#666', marginBottom: '3px' }}>
                              <strong>Issuer:</strong> {vc.issuer?.id || vc.issuer || 'Unknown'}
                            </div>
                            <div style={{ fontSize: '13px', color: '#666', marginBottom: '3px' }}>
                              <strong>Subject:</strong> {vc.credentialSubject?.id || 'Unknown'}
                            </div>
                            <div style={{ fontSize: '13px', color: '#666', marginBottom: '3px' }}>
                              <strong>Issued:</strong> {vc.issuanceDate ? new Date(vc.issuanceDate).toLocaleString() : 'Unknown'}
                            </div>
                            {vc._metadata?.storedAt && (
                              <div style={{ fontSize: '13px', color: '#666', marginBottom: '3px' }}>
                                <strong>Stored:</strong> {new Date(vc._metadata.storedAt).toLocaleString()}
                              </div>
                            )}
                            
                            {/* Show credential subject claims */}
                            {vc.credentialSubject && (
                              <details style={{ marginTop: '10px' }}>
                                <summary style={{ cursor: 'pointer', fontSize: '13px', color: '#007bff' }}>
                                  View Claims
                                </summary>
                                <pre style={{
                                  marginTop: '10px',
                                  padding: '10px',
                                  backgroundColor: '#f8f9fa',
                                  borderRadius: '5px',
                                  overflow: 'auto',
                                  fontSize: '11px'
                                }}>
                                  {JSON.stringify(vc.credentialSubject, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Create VP section */}
          {vcs.length > 0 && (
            <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
              <h3>Create Verifiable Presentation</h3>
              <p style={{ fontSize: '14px', color: '#666' }}>
                Selected {selectedVcIds.size} credential{selectedVcIds.size !== 1 ? 's' : ''}.
                Click the button below to create a signed presentation.
              </p>
              
              <button
                onClick={handleCreateVP}
                disabled={selectedVcIds.size === 0 || creatingVP}
                style={{
                  padding: '10px 20px',
                  marginTop: '15px',
                  backgroundColor: (selectedVcIds.size === 0 || creatingVP) ? '#ccc' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: (selectedVcIds.size === 0 || creatingVP) ? 'not-allowed' : 'pointer'
                }}
              >
                {creatingVP ? 'Creating Presentation...' : 'Create Verifiable Presentation'}
              </button>

              {vpError && (
                <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f8d7da', borderRadius: '5px', color: '#721c24' }}>
                  <strong>✗ VP Creation Failed:</strong> {vpError}
                </div>
              )}

              {vp && (
                <div style={{ marginTop: '20px' }}>
                  <div style={{ padding: '10px', backgroundColor: '#d4edda', borderRadius: '5px', marginBottom: '15px' }}>
                    <strong>✓ Verifiable Presentation Created!</strong>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                      Your presentation has been signed with your DID and is ready to share.
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0, flex: 1 }}>Presentation JSON</h4>
                    <button
                      onClick={handleCopyToClipboard}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: copySuccess ? '#28a745' : '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                      }}
                    >
                      {copySuccess ? '✓ Copied!' : '📋 Copy to Clipboard'}
                    </button>
                  </div>

                  <pre style={{
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '5px',
                    overflow: 'auto',
                    fontSize: '12px',
                    maxHeight: '400px',
                    border: '1px solid #ddd'
                  }}>
                    {JSON.stringify(vp, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Vault;
