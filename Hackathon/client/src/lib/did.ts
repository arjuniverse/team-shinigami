/**
 * DID:PKH Management Library
 * Implements did:pkh (Public Key Hash) DID method using MetaMask
 * Spec: https://github.com/w3c-ccg/did-pkh/blob/main/did-pkh-method-draft.md
 */

import { ethers } from 'ethers';

/**
 * Get connected Ethereum address from MetaMask
 * @returns Promise<string> - Ethereum address (0x...)
 * @throws Error if MetaMask not installed or user rejects
 */
export async function getConnectedAddress(): Promise<string> {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed. Please install MetaMask to use DID features.');
  }

  try {
    // Request account access
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    }) as string[];

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found. Please unlock MetaMask.');
    }

    return accounts[0];
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('User rejected the request');
    }
    throw new Error(`Failed to get address: ${error.message}`);
  }
}

/**
 * Create a did:pkh DID from Ethereum address and chain ID
 * Format: did:pkh:eip155:<chainId>:<address>
 * 
 * @param address - Ethereum address (0x...)
 * @param chainId - EIP-155 chain ID (1 = mainnet, 31337 = hardhat local)
 * @returns string - DID string
 * 
 * @example
 * createDidPkh('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 31337)
 * // Returns: 'did:pkh:eip155:31337:0x742d35cc6634c0532925a3b844bc9e7595f0beb'
 */
export function createDidPkh(address: string, chainId: number): string {
  // Validate address format
  if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw new Error('Invalid Ethereum address format');
  }

  // Normalize address to lowercase (per DID:PKH spec)
  const normalizedAddress = address.toLowerCase();

  // Construct DID according to did:pkh spec
  // Format: did:pkh:eip155:<chainId>:<address>
  return `did:pkh:eip155:${chainId}:${normalizedAddress}`;
}

/**
 * Format a minimal DID Document for a did:pkh DID
 * This is a local resolver implementation (MVP)
 * 
 * @param did - DID string (did:pkh:eip155:...)
 * @returns object - DID Document JSON
 * 
 * @example
 * formatDidDocument('did:pkh:eip155:31337:0x742d35cc...')
 * // Returns DID Document with verification method
 */
export function formatDidDocument(did: string): object {
  // Parse DID to extract components
  const parts = did.split(':');
  if (parts.length !== 5 || parts[0] !== 'did' || parts[1] !== 'pkh' || parts[2] !== 'eip155') {
    throw new Error('Invalid did:pkh format. Expected: did:pkh:eip155:<chainId>:<address>');
  }

  const chainId = parts[3];
  const address = parts[4];

  // Construct minimal DID Document per W3C DID Core spec
  // https://www.w3.org/TR/did-core/
  return {
    '@context': [
      'https://www.w3.org/ns/did/v1',
      'https://w3id.org/security/suites/secp256k1recovery-2020/v2'
    ],
    id: did,
    // Verification method for EIP-191 personal_sign
    verificationMethod: [
      {
        id: `${did}#controller`,
        type: 'EcdsaSecp256k1RecoveryMethod2020',
        controller: did,
        // blockchainAccountId per CAIP-10
        blockchainAccountId: `eip155:${chainId}:${address}`
      }
    ],
    // Authentication capability
    authentication: [`${did}#controller`],
    // Assertion method for signing credentials
    assertionMethod: [`${did}#controller`]
  };
}

/**
 * Sign a challenge string using MetaMask (EIP-191 personal_sign)
 * This is used for DID-Auth challenge-response flow
 * 
 * @param challenge - Challenge string (nonce) from issuer
 * @returns Promise<{ signature: string, address: string }> - Signature and signer address
 * @throws Error if MetaMask not available or user rejects
 * 
 * @example
 * const { signature, address } = await signChallenge('random-nonce-123');
 * // signature: '0x...' (65 bytes hex)
 * // address: '0x...' (signer address)
 */
export async function signChallenge(challenge: string): Promise<{ signature: string; address: string }> {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed');
  }

  try {
    // Get current address
    const address = await getConnectedAddress();

    // Sign challenge using EIP-191 personal_sign
    // This prepends "\x19Ethereum Signed Message:\n" + len(message)
    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [challenge, address]
    }) as string;

    return {
      signature,
      address
    };
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('User rejected signature request');
    }
    throw new Error(`Failed to sign challenge: ${error.message}`);
  }
}

/**
 * Get current chain ID from MetaMask
 * @returns Promise<number> - Chain ID
 */
export async function getChainId(): Promise<number> {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed');
  }

  const chainId = await window.ethereum.request({
    method: 'eth_chainId'
  }) as string;

  // Convert hex to decimal
  return parseInt(chainId, 16);
}

/**
 * Extract address from did:pkh DID
 * @param did - DID string
 * @returns string - Ethereum address
 */
export function extractAddressFromDid(did: string): string {
  const parts = did.split(':');
  if (parts.length !== 5 || parts[0] !== 'did' || parts[1] !== 'pkh') {
    throw new Error('Invalid DID format');
  }
  return parts[4];
}

/**
 * Extract chain ID from did:pkh DID
 * @param did - DID string
 * @returns number - Chain ID
 */
export function extractChainIdFromDid(did: string): number {
  const parts = did.split(':');
  if (parts.length !== 5 || parts[0] !== 'did' || parts[1] !== 'pkh') {
    throw new Error('Invalid DID format');
  }
  return parseInt(parts[3], 10);
}

/**
 * Verify a signature matches the expected address (client-side verification)
 * @param message - Original message that was signed
 * @param signature - Signature to verify
 * @param expectedAddress - Expected signer address
 * @returns boolean - True if signature is valid
 */
export function verifySignature(message: string, signature: string, expectedAddress: string): boolean {
  try {
    // Recover address from signature
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    // Compare addresses (case-insensitive)
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}
