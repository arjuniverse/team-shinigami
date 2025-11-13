import { useState } from 'react';

function Verifier() {
  const [vpInput, setVpInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [verificationError, setVerificationError] = useState(null);

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        // Validate it's valid JSON
        JSON.parse(content);
        setVpInput(content);
        setVerificationResult(null);
        setVerificationError(null);
      } catch (error) {
        setVerificationError('Invalid JSON file. Please upload a valid VP JSON file.');
      }
    };
    reader.onerror = () => {
      setVerificationError('Failed to read file. Please try again.');
    };
    reader.readAsText(file);
  };

  // Handle VP verification
  const handleVerify = async () => {
    if (!vpInput.trim()) {
      setVerificationError('Please paste or upload a VP JSON to verify');
      return;
    }

    // Validate JSON format
    let vp;
    try {
      vp = JSON.parse(vpInput);
    } catch (error) {
      setVerificationError('Invalid JSON format. Please check your input.');
      return;
    }

    // Basic VP structure validation
    if (!vp.type || !Array.isArray(vp.type) || !vp.type.includes('VerifiablePresentation')) {
      setVerificationError('Invalid VP structure. Missing or incorrect "type" field.');
      return;
    }

    if (!vp.verifiableCredential) {
      setVerificationError('Invalid VP structure. Missing "verifiableCredential" field.');
      return;
    }

    setVerifying(true);
    setVerificationError(null);
    setVerificationResult(null);

    try {
      // Call issuer /verify endpoint
      const issuerApiUrl = import.meta.env.VITE_ISSUER_API_URL || 'http://localhost:8080';
      const response = await fetch(`${issuerApiUrl}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ vp })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Verification request failed' }));
        throw new Error(errorData.error || `Verification failed: ${response.status}`);
      }

      const result = await response.json();
      setVerificationResult(result);
    } catch (error) {
      setVerificationError(error.message);
    } finally {
      setVerifying(false);
    }
  };

  // Handle clear
  const handleClear = () => {
    setVpInput('');
    setVerificationResult(null);
    setVerificationError(null);
  };

  return (
    <div>
      <h2>Verifier</h2>
      <p>Verify verifiable presentations by checking cryptographic proofs and revocation status.</p>

      {/* VP Input Section */}
      <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h3>Submit Verifiable Presentation</h3>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
          Paste the VP JSON below or upload a VP JSON file.
        </p>

        {/* File upload option */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'inline-block', marginRight: '10px', fontWeight: 'bold' }}>
            Upload VP File:
          </label>
          <input
            type="file"
            accept=".json,application/json"
            onChange={handleFileUpload}
            style={{ padding: '5px' }}
          />
        </div>

        {/* Textarea for pasting VP */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Or Paste VP JSON:
          </label>
          <textarea
            value={vpInput}
            onChange={(e) => {
              setVpInput(e.target.value);
              setVerificationResult(null);
              setVerificationError(null);
            }}
            placeholder='Paste VP JSON here, e.g., {"@context": [...], "type": ["VerifiablePresentation"], ...}'
            style={{
              width: '100%',
              minHeight: '200px',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '5px',
              fontFamily: 'monospace',
              fontSize: '12px',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Action buttons */}
        <div>
          <button
            onClick={handleVerify}
            disabled={!vpInput.trim() || verifying}
            style={{
              padding: '10px 20px',
              marginRight: '10px',
              backgroundColor: (!vpInput.trim() || verifying) ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: (!vpInput.trim() || verifying) ? 'not-allowed' : 'pointer'
            }}
          >
            {verifying ? 'Verifying...' : '🔍 Verify Presentation'}
          </button>
          <button
            onClick={handleClear}
            disabled={verifying}
            style={{
              padding: '10px 20px',
              backgroundColor: 'white',
              color: '#333',
              border: '1px solid #ccc',
              borderRadius: '5px',
              cursor: verifying ? 'not-allowed' : 'pointer'
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Verification Result Section */}
      {verificationResult && (
        <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <h3>Verification Result</h3>
          
          {/* Visual indicator for verified/failed status */}
          <div style={{
            padding: '15px',
            marginTop: '15px',
            backgroundColor: verificationResult.verified ? '#d4edda' : '#f8d7da',
            borderRadius: '5px',
            border: verificationResult.verified ? '2px solid #28a745' : '2px solid #dc3545'
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: verificationResult.verified ? '#155724' : '#721c24',
              marginBottom: '10px'
            }}>
              {verificationResult.verified ? '✓ VERIFIED' : '✗ VERIFICATION FAILED'}
            </div>
            
            <div style={{
              fontSize: '16px',
              color: verificationResult.verified ? '#155724' : '#721c24'
            }}>
              <strong>Status:</strong> {verificationResult.reason || 'No reason provided'}
            </div>
          </div>

          {/* Detailed verification information */}
          {verificationResult.details && (
            <details style={{ marginTop: '20px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', color: '#007bff' }}>
                View Detailed Verification Information
              </summary>
              <pre style={{
                marginTop: '10px',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '5px',
                overflow: 'auto',
                fontSize: '12px',
                border: '1px solid #ddd'
              }}>
                {JSON.stringify(verificationResult.details, null, 2)}
              </pre>
            </details>
          )}

          {/* Full result JSON */}
          <details style={{ marginTop: '15px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', color: '#007bff' }}>
              View Full Verification Response
            </summary>
            <pre style={{
              marginTop: '10px',
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '5px',
              overflow: 'auto',
              fontSize: '12px',
              border: '1px solid #ddd'
            }}>
              {JSON.stringify(verificationResult, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* Error Display */}
      {verificationError && (
        <div style={{ marginTop: '30px', padding: '20px', border: '2px solid #dc3545', borderRadius: '5px', backgroundColor: '#f8d7da' }}>
          <h3 style={{ color: '#721c24', marginTop: 0 }}>Verification Error</h3>
          <div style={{ color: '#721c24', fontSize: '16px' }}>
            <strong>✗ Error:</strong> {verificationError}
          </div>
          <div style={{ marginTop: '15px', fontSize: '14px', color: '#856404', backgroundColor: '#fff3cd', padding: '10px', borderRadius: '5px' }}>
            <strong>Troubleshooting Tips:</strong>
            <ul style={{ marginTop: '5px', marginBottom: 0 }}>
              <li>Ensure the VP JSON is properly formatted</li>
              <li>Check that the issuer service is running on {import.meta.env.VITE_ISSUER_API_URL || 'http://localhost:8080'}</li>
              <li>Verify that the VP contains valid credentials</li>
              <li>Make sure the VP has been properly signed</li>
            </ul>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#e7f3ff', border: '1px solid #b3d9ff', borderRadius: '5px' }}>
        <h3 style={{ marginTop: 0 }}>ℹ️ How to Use</h3>
        <ol style={{ fontSize: '14px', lineHeight: '1.6' }}>
          <li>Obtain a Verifiable Presentation (VP) from the Vault section or from another holder</li>
          <li>Either paste the VP JSON in the textarea above or upload a VP JSON file</li>
          <li>Click "Verify Presentation" to check the cryptographic proofs and revocation status</li>
          <li>Review the verification result to confirm the presentation is valid</li>
        </ol>
        <p style={{ fontSize: '14px', marginBottom: 0, color: '#004085' }}>
          <strong>Note:</strong> The verifier checks both the cryptographic signatures and whether any credentials have been revoked by the issuer.
        </p>
      </div>
    </div>
  );
}

export default Verifier;
