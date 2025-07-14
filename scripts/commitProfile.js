const circomlib = require("circomlibjs");
const ethers = require("ethers");

async function main() {
  const poseidon = await circomlib.buildPoseidon();
  const F = poseidon.F;

  // Example user profile
  const age = 29;
  const gender = 1;
  const location = 12;
  const occupation = 3;
  const hobby = 5;
  const randomness = 123456; // must be random in practice!

  // Compute Poseidon hash
  const hash = poseidon([age, gender, location, occupation, hobby, randomness]);
  const commitment = F.toString(hash);

  console.log("Commitment (as decimal string):", commitment);

  // Convert to hex for contract
  const commitmentHex = "0x" + BigInt(commitment).toString(16);
  console.log("Commitment (hex):", commitmentHex);
}

main();
