/**
 * Blockchain integration using Ethers.js
 * Handles contract interactions for hash storage and verification
 */

import { ethers } from 'ethers';

const CONTRACT_ADDRESS = import.meta.env.VITE_DOCUMENT_HASH_CONTRACT;

// DocumentHash contract ABI
const CONTRACT_ABI = [
  'function storeHash(string calldata hash) external returns (bool)',
  'function checkHash(string calldata hash) external view returns (bool)',
  'function getHashTimestamp(string calldata hash) external view returns (uint256)',
  'event HashStored(string indexed originalHash, bytes32 indexed hashedKey, address indexed sender, uint256 timestamp)',
];

/**
 * Get Ethereum provider from MetaMask
 */
export function getProvider(): ethers.BrowserProvider {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed. Please install MetaMask to use blockchain features.');
  }
  return new ethers.BrowserProvider(window.ethereum);
}

/**
 * Request account access from MetaMask
 */
export async function connectWallet(): Promise<string> {
  const provider = getProvider();
  const accounts = await provider.send('eth_requestAccounts', []);
  return accounts[0];
}

/**
 * Get contract instance with signer
 */
async function getContract(): Promise<ethers.Contract> {
  if (!CONTRACT_ADDRESS) {
    throw new Error('VITE_DOCUMENT_HASH_CONTRACT not configured. Deploy contract and add address to .env');
  }

  const provider = getProvider();
  const signer = await provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

/**
 * Store document hash on blockchain
 * @param sha256Hash - 64-character hex SHA-256 hash
 * @returns Promise with transaction hash
 */
export async function storeHashOnChain(sha256Hash: string): Promise<string> {
  if (!/^[a-fA-F0-9]{64}$/.test(sha256Hash)) {
    throw new Error('Invalid SHA-256 hash format');
  }

  try {
    const contract = await getContract();
    const tx = await contract.storeHash(sha256Hash);
    
    console.log('Transaction sent:', tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt.hash);
    
    return receipt.hash;
  } catch (error: any) {
    console.error('Blockchain error:', error);
    
    if (error.code === 'ACTION_REJECTED') {
      throw new Error('Transaction rejected by user');
    }
    
    if (error.message?.includes('Hash already stored')) {
      throw new Error('This document hash is already stored on the blockchain');
    }
    
    throw new Error(`Failed to store hash on blockchain: ${error.message}`);
  }
}

/**
 * Check if hash exists on blockchain
 * @param sha256Hash - 64-character hex SHA-256 hash
 * @returns Promise<boolean> - True if hash exists
 */
export async function checkHashOnChain(sha256Hash: string): Promise<boolean> {
  if (!/^[a-fA-F0-9]{64}$/.test(sha256Hash)) {
    throw new Error('Invalid SHA-256 hash format');
  }

  try {
    const contract = await getContract();
    return await contract.checkHash(sha256Hash);
  } catch (error: any) {
    console.error('Blockchain check error:', error);
    throw new Error(`Failed to check hash on blockchain: ${error.message}`);
  }
}

/**
 * Get timestamp when hash was stored
 * @param sha256Hash - 64-character hex SHA-256 hash
 * @returns Promise<number> - Unix timestamp (0 if not stored)
 */
export async function getHashTimestamp(sha256Hash: string): Promise<number> {
  if (!/^[a-fA-F0-9]{64}$/.test(sha256Hash)) {
    throw new Error('Invalid SHA-256 hash format');
  }

  try {
    const contract = await getContract();
    const timestamp = await contract.getHashTimestamp(sha256Hash);
    return Number(timestamp);
  } catch (error: any) {
    console.error('Blockchain timestamp error:', error);
    throw new Error(`Failed to get hash timestamp: ${error.message}`);
  }
}

/**
 * Get current connected account
 */
export async function getCurrentAccount(): Promise<string | null> {
  try {
    const provider = getProvider();
    const accounts = await provider.send('eth_accounts', []);
    return accounts[0] || null;
  } catch {
    return null;
  }
}
