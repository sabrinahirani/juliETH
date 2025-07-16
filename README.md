# JuliETH: Privacy-Preserving Dating

*This is a toy app for playing aroung with zkSNARKs, commitments, and smart contracts.*  
*Built with ❤️ using [circom](https://github.com/iden3/circom) + [snarkjs](https://github.com/iden3/snarkjs).*  

[▶️ See the demo on YouTube](https://youtu.be/0AZao5kEs-o)

## Overview

See the process [here](./JuliETH%20Show%20%2B%20Tell.pdf).

1. **Commit Profile:** Users generate commitments to profile attributes (i.e. age, gender, location, occupation, etc.) and register commitment to an on-chain registry `ProfileRegistry.sol`.
2. **Register Preferences:** Users register their preferences (desired qualities in a match) to an on-chain registry `PreferencesRegistry.sol`.
3. **Verify Match:** Users generate a proof to verify that they meet preferences without revealing personal information. This is verified by an on-chain verifier `Verifier.sol` and registered in an on-chain registry `MatchRegistry.sol`.

### 1. Commit Profile
 **JavaScript:** `scripts/commitProfile.js`
  ```js
  const poseidon = await circomlib.buildPoseidon();
  const F = poseidon.F;
  const commitment = F.toString(
    poseidon([age, gender, location, occupation, hobby, randomness])
  );
  ```
 **Solidity:** `contracts/ProfileRegistry.sol`
  ```solidity
  mapping(address => uint256) public commitments;
  function registerProfile(uint256 commitment) external {
      require(commitments[msg.sender] == 0, "Already registered");
      commitments[msg.sender] = commitment;
  }
  ```

### 2. Register Preferences
 **Solidity:** `contracts/PreferencesRegistry.sol`
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

### 3. Verify Match
 **Circom Circuit:** `circuits/match_profile.circom`
  ```circom
  template MatchProfile() {
      // ...inputs...
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
      // ...
      (geMin.out * leMax.out) === 1;
  }
  ```
**JavaScript:** `scripts/matchProfile.js`
  ```js
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    wasmPath,
    zkeyPath
  );
  ```
**Solidity:** `contracts/MatchRegistry.sol`
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

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Build match_profile Circuit (R1CS, WASM, ZKey)**
   ```bash
   circom circuits/match_profile.circom --r1cs --wasm --sym -o build/
   snarkjs groth16 setup build/match_profile.r1cs pot12_final.ptau build/match_profile.zkey
   snarkjs zkey export verificationkey build/match_profile.zkey build/match_profile.vkey.json
   ```

3. **Compile Smart Contracts**
   ```bash
   npx hardhat compile
   ```

4. **Set up .env**
   - Create a `.env` file in the root directory with your network and private key settings.

5. **Deploy Contracts**
   ```bash
   npx hardhat run scripts/deploy.js --network <network>
   ```

6. **Generate Commitments and Proofs**
   ```bash
   node scripts/commitProfile.js
   node scripts/matchProfile.js
   ```
