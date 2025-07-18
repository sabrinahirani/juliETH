const hre = require("hardhat");
const path = require("path");
const fs = require("fs");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  // to save ABI and address
  async function saveDeployment(name, contract) {
    const artifact = await hre.artifacts.readArtifact(name);
    const data = {
      address: contract.target,
      abi: artifact.abi,
    };
    const filePath = path.join(__dirname, "deployments", `${name}.json`);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Saved deployment info for ${name} to ${filePath}`);
  }

  // deploy profile registry
  const ProfileRegistry = await hre.ethers.getContractFactory("ProfileRegistry");
  const profileRegistry = await ProfileRegistry.deploy();
  await profileRegistry.waitForDeployment();
  console.log("ProfileRegistry.sol deployed to:", profileRegistry.target);
  await saveDeployment("ProfileRegistry", profileRegistry);

  // deploy preferences registry
  const PreferencesRegistry = await hre.ethers.getContractFactory("PreferencesRegistry");
  const preferencesRegistry = await PreferencesRegistry.deploy();
  await preferencesRegistry.waitForDeployment();
  console.log("PreferencesRegistry.sol deployed to:", preferencesRegistry.target);
  await saveDeployment("PreferencesRegistry", preferencesRegistry);

  // deploy verifier (generated from circom)
  const Verifier = await hre.ethers.getContractFactory("Groth16Verifier");
  const verifier = await Verifier.deploy();
  await verifier.waitForDeployment();
  console.log("Verifier.sol deployed to:", verifier.target);

  // deploy match registry
  const MatchVerifier = await hre.ethers.getContractFactory("MatchRegistry");
  const matchVerifier = await MatchVerifier.deploy(profileRegistry.target, preferencesRegistry.target, verifier.target);
  await matchVerifier.waitForDeployment();
  console.log("MatchRegistry.sol deployed to:", matchVerifier.target);
  await saveDeployment("MatchRegistry", matchVerifier);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
