const circomlib = require("circomlibjs");
const ethers = require("ethers");
const path = require("path");
const fs = require("fs");

async function main() {
  const poseidon = await circomlib.buildPoseidon();
  const F = poseidon.F;

  // TODO: example profile
  const age = 21;
  const gender = 1;
  const location = 12;
  const occupation = 3;
  const hobby = 5;
  const nonce = 123456; // should be random irl

  // compute commitment
  const hash = poseidon([age, gender, location, occupation, hobby, nonce]);
  const commitment = F.toObject(hash);

  console.log("Commitment (as decimal string):", F.toString(hash));

  // using local
  const provider = new ethers.JsonRpcProvider("http://localhost:8545"); 
  const ALICE_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const alice_wallet = new ethers.Wallet(ALICE_PRIVATE_KEY, provider);
  const BOB_PRIVATE_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
  const bob_wallet = new ethers.Wallet(BOB_PRIVATE_KEY, provider);

  const loadDeployment = (name) => {
    const file = path.join(__dirname, "deployments", `${name}.json`);
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  };

  const profileDeployment = loadDeployment("ProfileRegistry");
  const preferencesDeployment = loadDeployment("PreferencesRegistry");

  const ProfileRegistry = new ethers.Contract(profileDeployment.address, profileDeployment.abi, alice_wallet);
  const PreferencesRegistry = new ethers.Contract(preferencesDeployment.address, preferencesDeployment.abi, bob_wallet);

  // register profile
  const tx1 = await ProfileRegistry.registerProfile(commitment);
  await tx1.wait();
  console.log("Profile committed on-chain.");

  // TODO: example preferences
  const minAge = 18;
  const maxAge = 35;
  const acceptedGenders = [1, 2, 3];
  const desiredLocation = 12;
  const desiredOccupation = 3;
  const desiredHobby = 5;

  // register preferences
  const tx2 = await PreferencesRegistry.setPreferences(minAge, maxAge, acceptedGenders, desiredLocation, desiredOccupation, desiredHobby);
  await tx2.wait();
  console.log("Preferences registered on-chain.");
}

main();
