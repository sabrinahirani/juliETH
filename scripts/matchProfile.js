const circomlib = require("circomlibjs");
const snarkjs = require("snarkjs");
const { ethers } = require("ethers");
const path = require("path");
const fs = require("fs");

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

  // using same local
  const provider = new ethers.JsonRpcProvider("http://localhost:8545"); 
  const ALICE_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const alice_wallet = new ethers.Wallet(ALICE_PRIVATE_KEY, provider);
  const BOB_PRIVATE_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
  const bob_wallet = new ethers.Wallet(BOB_PRIVATE_KEY, provider);

  const loadDeployment = (name) => {
    const file = path.join(__dirname, "deployments", `${name}.json`);
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  };

  const preferencesRegistry = loadDeployment("PreferencesRegistry");
  const matchRegistry = loadDeployment("MatchRegistry");

  const PreferencesRegistry = new ethers.Contract(preferencesRegistry.address, preferencesRegistry.abi, alice_wallet);
  const MatchRegistry = new ethers.Contract(matchRegistry.address, matchRegistry.abi, alice_wallet);

  const prefs = await PreferencesRegistry.getPreferences(bob_wallet.address);

  const min_age = prefs.minAge;
  const max_age = prefs.maxAge;
  const accepted_genders = prefs.acceptedGenders.map((g) => Number(g)); // [uint8, uint8, uint8]
  const target_location = prefs.desiredLocation;
  const target_occupation = prefs.desiredOccupation;
  const target_hobby = prefs.desiredHobby;

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
    desired_location: target_location,
    desired_occupation: target_occupation,
    desired_hobby: target_hobby,
  };

  // load wasm and zkey
  const wasmPath = "../build/match_profile_js/match_profile.wasm";
  const zkeyPath = "../build/match_profile_final.zkey";

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

  const tx = await matchRegistry.verifyMatch(BOB_ADDRESS, a, b, c);
  const receipt = await tx.wait();

  console.log("✅ Match verification transaction sent. Tx hash:", receipt.transactionHash);
}

main();
