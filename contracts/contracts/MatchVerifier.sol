// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {PoseidonT3} from "./PoseidonT3.sol";

interface IProfileRegistry {
    function commitments(address user) external view returns (uint256);
}

interface IVerifier {
    function verifyProof(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[] calldata input
    ) external view returns (bool);
}

contract MatchVerifier {
    IProfileRegistry public profileRegistry;
    IVerifier public verifier;

    constructor(address _profileRegistry, address _verifier) {
        profileRegistry = IProfileRegistry(_profileRegistry);
        verifier = IVerifier(_verifier);
    }

    function poseidonHash(uint256[7] memory inputs) internal pure returns (uint256) {
        return PoseidonT3.poseidon(inputs);
    }

    function verifyMatch(
    uint256[2] calldata a,
    uint256[2][2] calldata b,
    uint256[2] calldata c,
    uint256[] calldata input
) external view returns (bool) {
    uint256 commitmentInProof = input[0];
    uint256 preferencesHashInProof = input[1];

    uint256 registeredCommitment = profileRegistry.commitments(msg.sender);
    require(registeredCommitment != 0, "Not registered");
    require(commitmentInProof == registeredCommitment, "Commitment mismatch");

    (
        uint8 minAge,
        uint8 maxAge,
        uint8[3] memory acceptedGenders,
        uint8 location,
        uint8 occupation,
        uint8 hobby,
        bool exists
    ) = preferencesRegistry.getPreferences(msg.sender);

    require(exists, "No preferences");

    uint256 preferencesHash = poseidonHash([
        uint256(minAge),
        uint256(maxAge),
        uint256(acceptedGenders[0]),
        uint256(acceptedGenders[1]),
        uint256(acceptedGenders[2]),
        uint256(location),
        uint256(occupation) + uint256(hobby) // same as circuit
    ]);

    require(preferencesHash == preferencesHashInProof, "Preferences hash mismatch");

    return verifier.verifyProof(a, b, c, input);
}
