// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IProfileRegistry {
    function commitments(address user) external view returns (uint256);
}

interface IPreferencesRegistry {
    function getPreferences(address user) external view returns (uint8 minAge, uint8 maxAge, uint8[3] memory acceptedGenders, uint8 desiredLocation, uint8 desiredOccupation, uint8 desiredHobby, bool exists);
}

interface IVerifier {
    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[9] calldata _pubSignals) external view returns (bool);
}

contract MatchRegistry {

    // profile registry
    IProfileRegistry public profileRegistry;

    // preferences registry
    IPreferencesRegistry public preferencesRegistry;

    // verifier (from circuit)
    IVerifier public verifier;

    mapping(address => address[]) public matches;

    constructor(address _profileRegistry, address _preferencesRegistry, address _verifier) {
        profileRegistry = IProfileRegistry(_profileRegistry);
        preferencesRegistry = IPreferencesRegistry(_preferencesRegistry);
        verifier = IVerifier(_verifier);
    }

    function verifyMatch(address potentialMatch, uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC) public view returns (bool) {
        uint256[9] memory input;
        input[0] = profileRegistry.commitments(msg.sender);
        require(input[0] != 0, "Not Registered");

        {
            (uint8 minAge, uint8 maxAge, uint8[3] memory acceptedGenders, uint8 location, uint8 occupation, uint8 hobby, bool exists) = preferencesRegistry.getPreferences(potentialMatch);
            require(exists, "No Preferences");
            input[1] = minAge;
            input[2] = maxAge;
            input[3] = acceptedGenders[0];
            input[4] = acceptedGenders[1];
            input[5] = acceptedGenders[2];
            input[6] = location;
            input[7] = occupation;
            input[8] = hobby;
        }

        if (verifier.verifyProof(_pA, _pB, _pC, input)) {
            // matches[potentialMatch].push(msg.sender);
            return true;
        }
        return false;
    }

    function getMatches(address user) public view returns (address[] memory) {
        return matches[user];
    }
}