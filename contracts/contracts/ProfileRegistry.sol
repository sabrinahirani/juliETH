// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ProfileRegistry {
    mapping(address => uint256) public commitments;

    event ProfileRegistered(address indexed user, uint256 commitment);

    function registerProfile(uint256 commitment) public {
        require(commitments[msg.sender] == 0, "Already Registered");
        commitments[msg.sender] = commitment;
        emit ProfileRegistered(msg.sender, commitment);
    }
}
