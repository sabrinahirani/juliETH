const circomlib = require("circomlibjs");
const snarkjs = require("snarkjs");
const { ethers } = require("ethers");
const path = require("path");
const fs = require("fs");

// utils
const { getContract, getAliceWallet, getBobWallet } = require("./utils");

async function main() {

  // 1. generate proof:

  // 1.1 generate commitment

  const poseidon = await circomlib.buildPoseidon();
  const F = poseidon.F;

  // same example profile
  const age = Number(21);
  const gender = Number(1);
  const location = Number(12);
  const occupation = Number(3);
  const hobby = Number(5);
  const nonce = Number(123456); // same nonce

  const hash = poseidon([age, gender, location, occupation, hobby, nonce]);
  const commitment = F.toString(hash);

  console.log("Commitment (as decimal string):", commitment);

  // 1.2 some setup

  const alice_wallet = getAliceWallet();
  const bob_wallet = getBobWallet();
  const PreferencesRegistry = getContract("PreferencesRegistry", alice_wallet);
  const MatchRegistry = getContract("MatchRegistry", alice_wallet);

  // 1.3 get preferences from registry

  const preferences = await PreferencesRegistry.getPreferences(bob_wallet.address);

  const min_age = Number(preferences.minAge);
  const max_age = Number(preferences.maxAge);
  let accepted_genders = preferences.acceptedGenders.map((g) => Number(g));
  const desired_location = Number(preferences.desiredLocation);
  const desired_occupation = Number(preferences.desiredOccupation);
  const desired_hobby = Number(preferences.desiredHobby);

  // 1.4 construct input

  const input = {
    age,
    gender,
    location,
    occupation,
    hobby,
    nonce,
    commitment,
    min_age,
    max_age,
    accepted_genders,
    desired_location,
    desired_occupation,
    desired_hobby,
  };

  // load wasm and zkey
  const wasmPath = "build/match_profile_js/match_profile.wasm";
  const zkeyPath = "build/match_profile_final.zkey";

  // 1.5 actually finally generate proof

  // generate proof
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    wasmPath,
    zkeyPath
  );

  console.log("Proof generated. ");

  // save proof
  fs.writeFileSync("proof.json", JSON.stringify(proof, null, 2));
  fs.writeFileSync("publicSignals.json", JSON.stringify(publicSignals, null, 2));

  // format for smart contract
  const callData = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
   const argv = callData
    .replace(/["[\]\s]/g, "")
    .split(",")
    .map((x) => BigInt(x).toString());

  const a = [argv[0], argv[1]];
  const b = [
    [argv[2], argv[3]],
    [argv[4], argv[5]],
  ];
  const c = [argv[6], argv[7]];

  // 2. verify in match registry

  const tx = await MatchRegistry.verifyMatch(bob_wallet.address, a, b, c);
  // await tx.wait();

  // check result
  const isMatched = await MatchRegistry.getMatches(bob_wallet.address); // true
  // const isMatched = matches.map(addr => addr.toLowerCase()).includes(alice_wallet.address.toLowerCase()); // true

  if (isMatched) {
    console.log(`Alice (${alice_wallet.address}) is now matched with Bob (${bob_wallet.address})!`);
  } else {
    console.log(`Alice is NOT matched with Bob.`);
  }
  
}

main();
