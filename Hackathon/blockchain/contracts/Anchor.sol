// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Anchor
 * @dev Smart contract for anchoring credential hashes on blockchain
 * Provides tamper-proof storage of credential references
 */
contract Anchor {
    // Mapping to store anchored hashes
    mapping(bytes32 => bool) public anchors;
    
    // Event emitted when a hash is anchored
    event Anchored(bytes32 indexed hash, address indexed sender, uint256 timestamp);
    
    /**
     * @dev Anchors a hash on the blockchain
     * @param hash The bytes32 hash to anchor
     * @return success Boolean indicating successful anchoring
     */
    function anchor(bytes32 hash) public returns (bool) {
        require(!anchors[hash], "Hash already anchored");
        
        anchors[hash] = true;
        emit Anchored(hash, msg.sender, block.timestamp);
        
        return true;
    }
    
    /**
     * @dev Checks if a hash has been anchored
     * @param hash The bytes32 hash to check
     * @return Boolean indicating if hash is anchored
     */
    function isAnchored(bytes32 hash) public view returns (bool) {
        return anchors[hash];
    }
}
