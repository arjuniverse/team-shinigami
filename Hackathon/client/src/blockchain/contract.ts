/**
 * Blockchain contract integration
 * Loads deployment info and provides contract interaction methods
 */

import { ethers } from 'ethers';

// Deployment info - loaded from environment or fetched dynamically
const CONTRACT_ADDRESS = import.meta.env.VITE_DOCUMENT_HASH_CONTRACT;
const CHAIN_ID = import.meta.env.VITE_CHAIN_ID;

// Contract ABI
const CONTRACT_ABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "originalHash",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "hashedKey",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "HashStored",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "hash",
        "type": "string"
      }
    ],
    "name": "checkHash",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "hash",
        "type": "string"
      }
    ],
    "name": "getHashTimestamp",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "hash",
        "type": "string"
      }
    ],
    "name": "storeHash",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "name": "storedHashes",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

/**
 * Get Ethereum provider (MetaMask or localhost)
 */
export function getProvider(): ethers.BrowserProvider | ethers.JsonRpcProvider {
  // Try MetaMask first
  if (typeof window !== 'undefined' && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  
  // Fallback to localhost RPC
  console.log('📡 Using localhost RPC provider');
  return new ethers.JsonRpcProvider('http://127.0.0.1:8545');
}

/**
 * Get contract instance
 */
async function getContract(): Promise<ethers.Contract> {
  if (!CONTRACT_ADDRESS) {
    throw new Error('Contract not deployed. Add VITE_DOCUMENT_HASH_CONTRACT to .env file');
  }

  const provider = getProvider();
  
  // Get signer (MetaMask or first Hardhat account)
  let signer;
  if (provider instanceof ethers.BrowserProvider) {
    // MetaMask - request account access
    await provider.send('eth_requestAccounts', []);
    signer = await provider.getSigner();
  } else {
    // Localhost - use first Hardhat account
    const accounts = await provider.listAccounts();
    if (accounts.length === 0) {
      throw new Error('No accounts available on localhost');
    }
    signer = await provider.getSigner(accounts[0].address);
  }

  return new ethers.Contract(
    CONTRACT_ADDRESS,
    CONTRACT_ABI,
    signer
  );
}

/**
 * Get contract instance for read-only operations
 */
async function getContractReadOnly(): Promise<ethers.Contract> {
  if (!CONTRACT_ADDRESS) {
    throw new Error('Contract not deployed. Add VITE_DOCUMENT_HASH_CONTRACT to .env file');
  }

  const provider = getProvider();
  
  return new ethers.Contract(
    CONTRACT_ADDRESS,
    CONTRACT_ABI,
    provider
  );
}

/**
 * Store hash on blockchain
 * @param hexHash - SHA-256 hash as hex string (64 characters)
 * @returns Transaction hash
 */
export async function storeHashOnChain(hexHash: string): Promise<string> {
  if (!/^[a-fA-F0-9]{64}$/.test(hexHash)) {
    throw new Error('Invalid SHA-256 hash format. Must be 64 hex characters.');
  }

  try {
    const contract = await getContract();
    
    console.log('📤 Storing hash on blockchain:', hexHash);
    const tx = await contract.storeHash(hexHash);
    console.log('⏳ Transaction sent:', tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed:', receipt.hash);
    
    return receipt.hash;
  } catch (error: any) {
    console.error('❌ Blockchain error:', error);
    
    if (error.code === 'ACTION_REJECTED') {
      throw new Error('Transaction rejected by user');
    }
    
    if (error.message?.includes('Hash already stored')) {
      throw new Error('This document hash is already stored on the blockchain');
    }
    
    throw new Error(`Failed to store hash: ${error.message}`);
  }
}

/**
 * Check if hash exists on blockchain
 * @param hexHash - SHA-256 hash as hex string (64 characters)
 * @returns True if hash exists
 */
export async function checkHashOnChain(hexHash: string): Promise<boolean> {
  if (!/^[a-fA-F0-9]{64}$/.test(hexHash)) {
    throw new Error('Invalid SHA-256 hash format. Must be 64 hex characters.');
  }

  try {
    const contract = await getContractReadOnly();
    const exists = await contract.checkHash(hexHash);
    console.log('🔍 Hash exists on blockchain:', exists);
    return exists;
  } catch (error: any) {
    console.error('❌ Blockchain check error:', error);
    throw new Error(`Failed to check hash: ${error.message}`);
  }
}

/**
 * Get timestamp when hash was stored
 * @param hexHash - SHA-256 hash as hex string (64 characters)
 * @returns Unix timestamp (0 if not stored)
 */
export async function getHashTimestamp(hexHash: string): Promise<number> {
  if (!/^[a-fA-F0-9]{64}$/.test(hexHash)) {
    throw new Error('Invalid SHA-256 hash format. Must be 64 hex characters.');
  }

  try {
    const contract = await getContractReadOnly();
    const timestamp = await contract.getHashTimestamp(hexHash);
    return Number(timestamp);
  } catch (error: any) {
    console.error('❌ Blockchain timestamp error:', error);
    throw new Error(`Failed to get timestamp: ${error.message}`);
  }
}

/**
 * Get current connected account
 */
export async function getCurrentAccount(): Promise<string | null> {
  try {
    const provider = getProvider();
    
    if (provider instanceof ethers.BrowserProvider) {
      // MetaMask
      const accounts = await provider.send('eth_accounts', []);
      return accounts[0] || null;
    } else {
      // Localhost
      const accounts = await provider.listAccounts();
      return accounts[0]?.address || null;
    }
  } catch (error) {
    console.error('Failed to get account:', error);
    return null;
  }
}

/**
 * Connect wallet (MetaMask or use Hardhat account)
 */
export async function connectWallet(): Promise<string> {
  const provider = getProvider();
  
  if (provider instanceof ethers.BrowserProvider) {
    // MetaMask - request access
    const accounts = await provider.send('eth_requestAccounts', []);
    return accounts[0];
  } else {
    // Localhost - use first Hardhat account
    const accounts = await provider.listAccounts();
    if (accounts.length === 0) {
      throw new Error('No accounts available on localhost');
    }
    return accounts[0].address;
  }
}

/**
 * Get contract address
 */
export function getContractAddress(): string | null {
  return CONTRACT_ADDRESS || null;
}

/**
 * Get network info
 */
export function getNetworkInfo(): { name: string; chainId: number } | null {
  if (!CONTRACT_ADDRESS || !CHAIN_ID) return null;
  return {
    name: 'localhost',
    chainId: Number(CHAIN_ID)
  };
}
