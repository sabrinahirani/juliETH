const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  // Deploy ProfileRegistry
  const ProfileRegistry = await hre.ethers.getContractFactory("ProfileRegistry");
  const profileRegistry = await ProfileRegistry.deploy();
  await profileRegistry.deployed();
  console.log("ProfileRegistry deployed to:", profileRegistry.address);

  // Deploy PreferencesRegistry
  const PreferencesRegistry = await hre.ethers.getContractFactory("PreferencesRegistry");
  const preferencesRegistry = await PreferencesRegistry.deploy();
  await preferencesRegistry.deployed();
  console.log("PreferencesRegistry deployed to:", preferencesRegistry.address);

  // Deploy Verifier (generated from circom)
  const Verifier = await hre.ethers.getContractFactory("Verifier");
  const verifier = await Verifier.deploy();
  await verifier.deployed();
  console.log("Verifier deployed to:", verifier.address);

  // Deploy MatchVerifier with links to ProfileRegistry and Verifier
  const MatchVerifier = await hre.ethers.getContractFactory("MatchVerifier");
  const matchVerifier = await MatchVerifier.deploy(profileRegistry.address, verifier.address);
  await matchVerifier.deployed();
  console.log("MatchVerifier deployed to:", matchVerifier.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
