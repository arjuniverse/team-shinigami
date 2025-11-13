/**
 * Mock data for demo and development purposes
 * TODO: Remove or disable in production
 */

export const mockCredentials = [
  {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id: 'urn:uuid:mock-credential-1',
    type: ['VerifiableCredential', 'DocumentCredential'],
    issuer: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
    issuanceDate: '2024-01-15T10:30:00Z',
    credentialSubject: {
      id: 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH',
      storageKey: 'documents/sample-passport-encrypted.bin',
      docType: 'passport',
      fileName: 'passport.pdf',
      uploadTimestamp: '2024-01-15T10:30:00Z',
    },
    _metadata: {
      vcId: 'urn:uuid:mock-credential-1',
      storedAt: '2024-01-15T10:30:00Z',
    },
  },
  {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id: 'urn:uuid:mock-credential-2',
    type: ['VerifiableCredential', 'DocumentCredential'],
    issuer: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
    issuanceDate: '2024-01-20T14:15:00Z',
    credentialSubject: {
      id: 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH',
      storageKey: 'documents/sample-license-encrypted.bin',
      docType: 'license',
      fileName: 'drivers-license.jpg',
      uploadTimestamp: '2024-01-20T14:15:00Z',
    },
    _metadata: {
      vcId: 'urn:uuid:mock-credential-2',
      storedAt: '2024-01-20T14:15:00Z',
    },
  },
  {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id: 'urn:uuid:mock-credential-3',
    type: ['VerifiableCredential', 'DocumentCredential'],
    issuer: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
    issuanceDate: '2024-02-01T09:00:00Z',
    credentialSubject: {
      id: 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH',
      storageKey: 'documents/sample-diploma-encrypted.bin',
      docType: 'diploma',
      fileName: 'university-diploma.pdf',
      uploadTimestamp: '2024-02-01T09:00:00Z',
    },
    _metadata: {
      vcId: 'urn:uuid:mock-credential-3',
      storedAt: '2024-02-01T09:00:00Z',
    },
  },
];

export const mockVerificationResult = {
  verified: true,
  holder: 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH',
  credentialCount: 2,
  issuers: ['did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK'],
  revoked: false,
  timestamp: new Date().toISOString(),
};

/**
 * Populate vault with mock credentials for demo
 * @param {string} passphrase - Passphrase to encrypt mock credentials
 */
export async function populateMockVault(passphrase) {
  const { encryptVC, storeVC } = await import('./cryptoVault');
  
  for (const credential of mockCredentials) {
    try {
      const encryptedVC = await encryptVC(credential, passphrase);
      storeVC(credential.id, encryptedVC);
    } catch (error) {
      console.error('Failed to store mock credential:', error);
    }
  }
}

/**
 * Check if running in demo mode
 */
export function isDemoMode() {
  return import.meta.env.VITE_DEMO_MODE === 'true';
}
