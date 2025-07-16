const path = require("path");
const fs = require("fs");
const { ethers } = require("ethers");
require("dotenv").config();

function loadDeployment(name) {
  const file = path.join(__dirname, "..", "deployments", `${name}.json`);
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function getContract(name, walletOrProvider) {
  const deployment = loadDeployment(name);
  return new ethers.Contract(deployment.address, deployment.abi, walletOrProvider);
}

function getProvider() {
  return new ethers.JsonRpcProvider(process.env.PROVIDER_URL);
}

function getAliceWallet() {
  return new ethers.Wallet(process.env.ALICE_PRIVATE_KEY, getProvider());
}

function getBobWallet() {
  return new ethers.Wallet(process.env.BOB_PRIVATE_KEY, getProvider());
}

module.exports = {
  loadDeployment,
  getContract,
  getProvider,
  getAliceWallet,
  getBobWallet,
}; 