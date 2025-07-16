const circomlib = require("circomlibjs");
const snarkjs = require("snarkjs");
const { ethers } = require("ethers");
const path = require("path");
const fs = require("fs");
const { getContract, getAliceWallet, getBobWallet } = require("./utils");

async function main() {
  const poseidon = await circomlib.buildPoseidon();
  const F = poseidon.F;

  // same example profile
  const age = 21;
  const gender = 1;
  const location = 12;
  const occupation = 3;
  const hobby = 5;
  const nonce = 123456; // same nonce

  const hash = poseidon([age, gender, location, occupation, hobby, nonce]);
  const commitment = F.toObject(hash);

  console.log("Commitment (as decimal string):", F.toString(hash));

  // Use utils.js to get wallets
  const alice_wallet = getAliceWallet();
  const bob_wallet = getBobWallet();

  // Use utils.js to get contract instances
  const PreferencesRegistry = getContract("PreferencesRegistry", alice_wallet);
  const MatchRegistry = getContract("MatchRegistry", alice_wallet);

  const prefs = await PreferencesRegistry.getPreferences(bob_wallet.address);

  const min_age = Number(prefs.minAge);
  const max_age = Number(prefs.maxAge);
  let accepted_genders = prefs.acceptedGenders.map((g) => Number(g)); // [uint8, uint8, uint8]
  // Ensure accepted_genders is always length 3
  while (accepted_genders.length < 3) accepted_genders.push(0);
  const target_location = Number(prefs.desiredLocation);
  const target_occupation = Number(prefs.desiredOccupation);
  const target_hobby = Number(prefs.desiredHobby);

  const input = {
    age: Number(age),
    gender: Number(gender),
    location: Number(location),
    occupation: Number(occupation),
    hobby: Number(hobby),
    nonce: Number(nonce),
    commitment: F.toString(hash),
    min_age,
    max_age,
    accepted_genders,
    desired_location: target_location,
    desired_occupation: target_occupation,
    desired_hobby: target_hobby,
  };

  // load wasm and zkey
  const wasmPath = "build/match_profile_js/match_profile.wasm";
  const zkeyPath = "build/match_profile_final.zkey";

  // generate proof
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    wasmPath,
    zkeyPath
  );

  console.log("Proof generated. ");
  console.log("Public signals: ", publicSignals);

  // save proof and public signals
  fs.writeFileSync("proof.json", JSON.stringify(proof, null, 2));
  fs.writeFileSync("publicSignals.json", JSON.stringify(publicSignals, null, 2));

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

  const tx = await MatchRegistry.verifyMatch(bob_wallet.address, a, b, c);
  const receipt = await tx.wait();

  // Parse the MatchVerified event from the receipt logs
  let matchResult = null;
  for (const log of receipt.logs) {
    try {
      const parsed = MatchRegistry.interface.parseLog(log);
      if (parsed.name === "MatchVerified") {
        matchResult = parsed.args.result;
        console.log(`MatchVerified event: potentialMatch=${parsed.args.potentialMatch}, sender=${parsed.args.sender}, result=${parsed.args.result}`);
        break;
      }
    } catch (e) {
      // Not a MatchVerified event, skip
    }
  }
  if (matchResult !== null) {
    console.log("✅ Match verification result:", matchResult);
  } else {
    console.log("❌ MatchVerified event not found in transaction logs.");
  }

  console.log("✅ Match verification transaction sent. Tx hash:", receipt.transactionHash);
}

main();
