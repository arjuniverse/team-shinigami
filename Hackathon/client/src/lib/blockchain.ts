/**
 * Blockchain integration using Ethers.js
 * Re-exports from the contract module for backward compatibility
 */

export {
  getProvider,
  connectWallet,
  storeHashOnChain,
  checkHashOnChain,
  getHashTimestamp,
  getCurrentAccount,
  getContractAddress,
  getNetworkInfo
} from '../blockchain/contract';
