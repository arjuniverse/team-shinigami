// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DocumentHash
 * @dev Smart contract for storing and verifying document hashes on blockchain
 * Provides tamper-proof storage of SHA-256 hashes with efficient gas usage
 */
contract DocumentHash {
    // Mapping to store hashed document identifiers
    // Key: keccak256 hash of the SHA-256 hex string
    // Value: timestamp when the hash was stored
    mapping(bytes32 => uint256) public storedHashes;
    
    // Event emitted when a hash is stored
    event HashStored(
        string indexed originalHash,
        bytes32 indexed hashedKey,
        address indexed sender,
        uint256 timestamp
    );
    
    /**
     * @dev Store a document hash on the blockchain
     * @param hash The SHA-256 hash as a hex string (64 characters)
     * @return success Boolean indicating successful storage
     * 
     * Implementation: Converts the input hash string to bytes32 via keccak256
     * to save gas and ensure consistent sizing
     */
    function storeHash(string calldata hash) external returns (bool) {
        // Convert hash string to bytes32 for efficient storage
        bytes32 hashedKey = keccak256(abi.encodePacked(hash));
        
        // Check if hash already exists
        require(storedHashes[hashedKey] == 0, "Hash already stored");
        
        // Store with current timestamp
        storedHashes[hashedKey] = block.timestamp;
        
        emit HashStored(hash, hashedKey, msg.sender, block.timestamp);
        
        return true;
    }
    
    /**
     * @dev Check if a document hash has been stored
     * @param hash The SHA-256 hash as a hex string (64 characters)
     * @return exists Boolean indicating if hash is stored
     */
    function checkHash(string calldata hash) external view returns (bool) {
        bytes32 hashedKey = keccak256(abi.encodePacked(hash));
        return storedHashes[hashedKey] != 0;
    }
    
    /**
     * @dev Get the timestamp when a hash was stored
     * @param hash The SHA-256 hash as a hex string (64 characters)
     * @return timestamp Unix timestamp (0 if not stored)
     */
    function getHashTimestamp(string calldata hash) external view returns (uint256) {
        bytes32 hashedKey = keccak256(abi.encodePacked(hash));
        return storedHashes[hashedKey];
    }
}
