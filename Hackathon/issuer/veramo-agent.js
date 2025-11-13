const { createAgent } = require('@veramo/core');
const { KeyManager, MemoryKeyStore, MemoryPrivateKeyStore } = require('@veramo/key-manager');
const { DIDManager, MemoryDIDStore } = require('@veramo/did-manager');
const { KeyDIDProvider } = require('@veramo/did-provider-key');
const { CredentialPlugin } = require('@veramo/credential-w3c');
const { KeyManagementSystem } = require('@veramo/kms-local');
const { DIDResolverPlugin } = require('@veramo/did-resolver');
const { Resolver } = require('did-resolver');
const { getResolver: getKeyResolver } = require('key-did-resolver');

// TODO: Production improvement - Replace did:key with did:ethr for production deployments
// did:key is ephemeral and not resolvable on-chain. For production, use did:ethr with
// proper Ethereum network configuration (mainnet/testnet) to enable:
// - On-chain DID resolution
// - DID document updates and rotation
// - Integration with existing Ethereum infrastructure
// Example production setup:
// const { EthrDIDProvider } = require('@veramo/did-provider-ethr');
// providers: {
//   'did:ethr': new EthrDIDProvider({
//     defaultKms: 'local',
//     network: 'mainnet',
//     rpcUrl: process.env.ETHEREUM_RPC_URL,
//     registry: '0x...' // ENS registry address
//   })
// }

// Initialize in-memory stores for MVP
// These stores only persist during process lifetime
const memoryKeyStore = new MemoryKeyStore();
const memoryPrivateKeyStore = new MemoryPrivateKeyStore();
const memoryDIDStore = new MemoryDIDStore();

// Configure DID resolver for did:key method
const didResolver = new Resolver({
  ...getKeyResolver()
});

// Create and configure Veramo agent
const agent = createAgent({
  plugins: [
    // Key Manager - handles cryptographic key operations
    new KeyManager({
      store: memoryKeyStore,
      kms: {
        local: new KeyManagementSystem(memoryPrivateKeyStore)
      }
    }),

    // DID Manager - handles DID creation and management
    new DIDManager({
      store: memoryDIDStore,
      defaultProvider: 'did:key',
      providers: {
        'did:key': new KeyDIDProvider({
          defaultKms: 'local'
        })
      }
    }),

    // DID Resolver - resolves DIDs to DID documents
    new DIDResolverPlugin({
      resolver: didResolver
    }),

    // Credential Plugin - handles W3C Verifiable Credential operations
    new CredentialPlugin()
  ]
});

// Initialize issuer DID on agent startup
let issuerDid = null;

async function initializeIssuerDid() {
  try {
    // Create issuer DID using did:key provider
    const identifier = await agent.didManagerCreate({
      provider: 'did:key',
      kms: 'local',
      alias: 'issuer-did'
    });

    issuerDid = identifier.did;
    console.log('Issuer DID created:', issuerDid);
    return issuerDid;
  } catch (error) {
    console.error('Failed to create issuer DID:', error);
    throw error;
  }
}

// Get the issuer DID (must call initializeIssuerDid first)
function getIssuerDid() {
  if (!issuerDid) {
    throw new Error('Issuer DID not initialized. Call initializeIssuerDid() first.');
  }
  return issuerDid;
}

module.exports = {
  agent,
  initializeIssuerDid,
  getIssuerDid
};
