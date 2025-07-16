# JuliETH: Privacy-Preserving Dating

This is a toy app to play around with cryptography, zero-knowledge proofs, and smart contracts.

---

## Demo

[▶️ Watch the demo on YouTube](https://youtu.be/0AZao5kEs-o)

---

## How it Works: Step-by-Step

### 1. Commit Profile
- **Circom Circuit:** `circuits/commit_profile.circom`
  ```circom
  template CommitProfile() {
      signal input age;
      signal input gender;
      signal input location;
      signal input occupation;
      signal input hobby;
      signal input randomness;
      signal output commitment;
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
- **JavaScript:** `scripts/commitProfile.js`
  ```js
  const poseidon = await circomlib.buildPoseidon();
  const F = poseidon.F;
  const commitment = F.toString(
    poseidon([age, gender, location, occupation, hobby, randomness])
  );
  ```

### 2. Register Preferences
- **Solidity:** `contracts/PreferencesRegistry.sol`
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
- **Circom Circuit:** `circuits/match_profile.circom`
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
- **JavaScript:** `scripts/matchProfile.js`
  ```js
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    wasmPath,
    zkeyPath
  );
  ```
- **Solidity:** `contracts/MatchRegistry.sol`
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

---

## Technical Overview
- **Profile Commitment:** Users commit to profile attributes (age, gender, location, occupation, hobby) using a Poseidon hash in a Circom circuit.
- **Preference Matching:** Prove in zero-knowledge that a profile matches another user's preferences, without revealing private data.
- **On-chain Verification:** Smart contracts verify ZKPs and manage profile and preference registries.
- **Cryptographic Primitives:** Uses CircomLib for Poseidon, MiMC, BabyJubJub, etc.

### Circuits
- `circuits/commit_profile.circom`: Profile commitment circuit.
- `circuits/match_profile.circom`: Profile matching circuit.
- `circuits/circomlib/`: Cryptographic primitives.

### Smart Contracts
- `contracts/ProfileRegistry.sol`: Stores user profile commitments.
- `contracts/PreferencesRegistry.sol`: Stores user matching preferences.
- `contracts/Verifier.sol`: Verifies ZKPs (auto-generated).
- `contracts/MatchRegistry.sol`: Verifies profile matches using ZKPs and registry data.

### Scripts
- `scripts/commitProfile.js`: Generates a profile commitment.
- `scripts/matchProfile.js`: Generates a ZKP for profile matching.
- `scripts/deploy.js`: Deploys contracts.
- `scripts/utils.js`: Helpers.

---

## Repository Structure

- `circuits/` — Circom circuits and cryptographic libraries
- `contracts/` — Solidity smart contracts
- `scripts/` — JS scripts for proof generation and deployment

---

## Step-by-Step Commands

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Build Circuits (R1CS, WASM, ZKey)**
   ```bash
   # Example for commit_profile.circom
   circom circuits/commit_profile.circom --r1cs --wasm --sym -o build/
   snarkjs groth16 setup build/commit_profile.r1cs pot12_final.ptau build/commit_profile.zkey
   snarkjs zkey export verificationkey build/commit_profile.zkey build/commit_profile.vkey.json
   # Repeat for match_profile.circom
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

---

## Acknowledgements
- [Circom](https://github.com/iden3/circom)
- [snarkjs](https://github.com/iden3/snarkjs)
- [circomlib](https://github.com/iden3/circomlib) 