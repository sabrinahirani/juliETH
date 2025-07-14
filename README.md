# JuliETH: Privacy-Preserving Dating 💌 

## Overview

JuliETH is a privacy-preserving profile matching system leveraging zero-knowledge proofs (ZKPs) and smart contracts. It enables users to commit to their personal profiles and match with others based on preferences, all without revealing sensitive information. The system uses Circom circuits for ZKP generation and Solidity smart contracts for on-chain verification and registry management.

## Features
- **Profile Commitment:** Users commit to their profile attributes (age, gender, location, occupation, hobby) using a Poseidon hash in a ZKP circuit.
- **Preference Matching:** Users can set matching preferences and prove, in zero-knowledge, that their profile matches another user's preferences.
- **On-chain Verification:** Smart contracts verify ZKPs and manage profile and preference registries.
- **Cryptographic Primitives:** Utilizes CircomLib for standard cryptographic circuits (Poseidon, MiMC, BabyJubJub, etc.).

---

## Technical Breakdown

### Profile Commitment
- **How it works:**  
  Users create a cryptographic commitment to their profile attributes using a Poseidon hash inside a Circom circuit. This commitment is later registered on-chain.
- **Circuit:**  
  `circuits/commit_profile.circom`
  ```circom
  template CommitProfile() {
      // Private inputs: your profile attributes and a secret nonce
      signal input age;
      signal input gender;
      signal input location;
      signal input occupation;
      signal input hobby;
      signal input randomness;

      // Public output: the commitment hash
      signal output commitment;

      // Compute Poseidon hash of all private inputs
      component poseidonHasher = Poseidon(6);
      poseidonHasher.inputs[0] <== age;
      poseidonHasher.inputs[1] <== gender;
      poseidonHasher.inputs[2] <== location;
      poseidonHasher.inputs[3] <== occupation;
      poseidonHasher.inputs[4] <== hobby;
      poseidonHasher.inputs[5] <== randomness;

      commitment <== poseidonHasher.out;
  }
  ```
- **Commitment Generation (JavaScript):**  
  `scripts/commitProfile.js`
  ```js
  const poseidon = await circomlib.buildPoseidon();
  const F = poseidon.F;
  const commitment = F.toString(
    poseidon([age, gender, location, occupation, hobby, randomness])
  );
  ```

### Preference Matching
- **How it works:**  
  The user proves in zero-knowledge that their committed profile matches another user’s public preferences (age range, gender, location, etc.) using a Circom circuit. No private data is revealed.
- **Circuit:**  
  `circuits/match_profile.circom`
  ```circom
  template MatchProfile() {
      // ...inputs...

      // Recompute commitment and check it matches the public input
      component poseidonHasher = Poseidon(6);
      poseidonHasher.inputs[0] <== age;
      // ...other inputs...
      poseidonHasher.out === commitment;

      // Age checks
      component geMin = GreaterEq(8);
      geMin.in[0] <== age;
      geMin.in[1] <== min_age;

      component leMax = LessEq(8);
      leMax.in[0] <== age;
      leMax.in[1] <== max_age;

      // Gender, location, occupation, hobby checks...
      // Final match condition: age within range
      (geMin.out * leMax.out) === 1;
  }
  ```
- **Proof Generation (JavaScript):**  
  `scripts/matchProfile.js`
  ```js
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    wasmPath,
    zkeyPath
  );
  ```

### On-chain Verification
- **How it works:**  
  Smart contracts verify the zero-knowledge proof and ensure the commitment and preferences match what’s registered on-chain.
- **Profile Registry:**  
  `contracts/contracts/ProfileRegistry.sol`
  ```solidity
  mapping(address => uint256) public commitments;
  function registerProfile(uint256 commitment) external {
      require(commitments[msg.sender] == 0, "Already registered");
      commitments[msg.sender] = commitment;
  }
  ```
- **Preferences Registry:**  
  `contracts/contracts/PreferencesRegistry.sol`
  ```solidity
  struct Preferences {
      uint8 minAge;
      uint8 maxAge;
      uint8[3] acceptedGenders;
      uint8 location;
      uint8 occupation;
      uint8 hobby;
      bool exists;
  }
  mapping(address => Preferences) private preferences;
  function setPreferences(...) external { ... }
  ```
- **Match Verifier:**  
  `contracts/contracts/MatchVerifier.sol`
  ```solidity
  function verifyMatch(
      uint256[2] calldata a,
      uint256[2][2] calldata b,
      uint256[2] calldata c,
      uint256[] calldata input
  ) external view returns (bool) {
      uint256 registeredCommitment = profileRegistry.commitments(msg.sender);
      require(registeredCommitment != 0, "Not registered");
      require(commitmentInProof == registeredCommitment, "Commitment mismatch");
      // ...check preferences hash...
      return verifier.verifyProof(a, b, c, input);
  }
  ```

### Cryptographic Primitives
- **How it works:**  
  The system uses [CircomLib](https://github.com/iden3/circomlib) for efficient, SNARK-friendly cryptographic primitives such as Poseidon hash, MiMC hash, BabyJubJub elliptic curve operations, and more.  
  - These are imported in the circuits:
    ```circom
    include "circomlib/circuits/poseidon.circom";
    include "circomlib/circuits/bitify.circom";
    include "circomlib/circuits/comparators.circom";
    ```

---

## Repository Structure

- `circuits/`
  - `commit_profile.circom`: Circuit for committing to a user profile.
  - `match_profile.circom`: Circuit for proving profile matches preferences.
  - `circomlib/`: Library of reusable cryptographic circuits (Poseidon, MiMC, etc.).
- `contracts/`
  - `contracts/`
    - `ProfileRegistry.sol`: Registers and stores user profile commitments.
    - `PreferencesRegistry.sol`: Stores user matching preferences.
    - `verifier.sol`: Verifies ZKPs (auto-generated by snarkjs).
    - `MatchVerifier.sol`: Verifies profile matches using ZKPs and registry data.
  - `scripts/`: Deployment scripts for smart contracts.
  - `test/`: Hardhat tests for contracts.
- `scripts/`
  - `commitProfile.js`: Generates a profile commitment using Poseidon hash.
  - `matchProfile.js`: Generates a ZKP for profile matching using snarkjs.

## Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- npm or yarn
- [Circom](https://docs.circom.io/) (for compiling circuits)
- [snarkjs](https://github.com/iden3/snarkjs) (for ZKP generation)
- Hardhat (for smart contract development)

### Installation
1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd JuliETH
   ```
2. Install dependencies in each subproject:
   ```bash
   cd circuits/circomlib && npm install
   cd ../../contracts && npm install
   cd ../../scripts && npm install
   ```

### Usage

#### 1. Compile Circuits
- Use Circom to compile `commit_profile.circom` and `match_profile.circom`.
- Generate trusted setup and verifier contracts using snarkjs.

#### 2. Deploy Smart Contracts
- Use Hardhat to deploy contracts in the `contracts/` directory.
- Example deployment script: `contracts/scripts/deploy.js`.

#### 3. Generate Commitments and Proofs
- Use `scripts/commitProfile.js` to create a profile commitment.
- Use `scripts/matchProfile.js` to generate a ZKP for profile matching.

#### 4. On-chain Verification
- Submit proofs and commitments to the deployed contracts for verification and matching.

## Contributing
Pull requests and issues are welcome! Please open an issue to discuss major changes.

## License
- CircomLib: LGPL-3.0
- Other code: MIT (unless otherwise specified)

## Acknowledgements
- [Circom](https://github.com/iden3/circom)
- [snarkjs](https://github.com/iden3/snarkjs)
- [circomlib](https://github.com/iden3/circomlib) 