const circomlib = require("circomlibjs");
const ethers = require("ethers");
const path = require("path");
const fs = require("fs");

const { getContract, getAliceWallet, getBobWallet } = require("./utils");

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
  const alice_wallet = getAliceWallet();
  const bob_wallet = getBobWallet();

  const ProfileRegistry = getContract("ProfileRegistry", alice_wallet);
  const PreferencesRegistry = getContract("PreferencesRegistry", bob_wallet);

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
