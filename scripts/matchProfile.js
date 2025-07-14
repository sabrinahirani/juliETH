const snarkjs = require("snarkjs");
const fs = require("fs");
const circomlib = require("circomlibjs");

async function generateProof() {
  const poseidon = await circomlib.buildPoseidon();
  const F = poseidon.F;

  // Prover's private profile data
  const age = 29;
  const gender = 1;
  const location = 12;
  const occupation = 3;
  const hobby = 5;
  const randomness = 123456; // same as commitment randomness

  // Matcher's public preferences
  const min_age = 25;
  const max_age = 35;
  const accepted_genders = [1, 2, 3];
  const target_location = 12;
  const target_occupation = 3;
  const target_hobby = 5;

  // Compute commitment (should match the registered one)
  const commitment = poseidon([
    age,
    gender,
    location,
    occupation,
    hobby,
    randomness,
  ]);
  const commitmentStr = F.toString(commitment);

  // Prepare circuit inputs
  const input = {
    age,
    gender,
    location,
    occupation,
    hobby,
    randomness,
    commitment: commitmentStr,
    min_age,
    max_age,
    accepted_genders,
    target_location,
    target_occupation,
    target_hobby,
  };

  // Load wasm and zkey
  const wasmPath = "../build/match_profile_js/match_profile.wasm";
  const zkeyPath = "../build/match_profile_final.zkey";

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    wasmPath,
    zkeyPath
  );

  console.log("Proof: ", JSON.stringify(proof, null, 1));
  console.log("Public signals: ", publicSignals);

  // Save proof and public signals for on-chain verification
  fs.writeFileSync("proof.json", JSON.stringify(proof, null, 1));
  fs.writeFileSync("publicSignals.json", JSON.stringify(publicSignals, null, 1));
}

generateProof();
