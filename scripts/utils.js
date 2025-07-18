import { ethers } from "ethers";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

import { CdpClient } from "@coinbase/cdp-sdk"; // using cdp-sdk

dotenv.config();

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});

function loadDeployment(name) {
  const file = path.join("deployments", `${name}.json`);
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function getContract(name, walletOrProvider) {
  const deployment = loadDeployment(name);
  return new ethers.Contract(deployment.address, deployment.abi, walletOrProvider);
}

const cdp = new CdpClient({
  apiKeyId: "d45b59b8-96ca-43a1-a9bd-50ea8c9fcc74",
  apiKeySecret: "Q/klBomlWIy9j748gqAELWzXSJ9vSpEO+PVOpI6ZQuwy1Ncgvhe5gV7//rs5FamIAEbja5sad/VJWZeNZjCPuQ==",
  walletSecret: "MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgNMUdUbM2RDjlWYH0oxfGMLftYoOYt8e7IfNjX7d2D+yhRANCAARMLFHvBmm3K8qoLkQ/Ft2YWb2G7NBiVEVxLzL4/WGBF64Tb+lcON152/sGpT/fc77e2YutIfno1eWQ8upBsdnG",
});

async function getAliceAccount() {
  const account = await cdp.evm.getOrCreateAccount({ name: "Alice" });
  await cdp.evm.requestFaucet({
    address: account.address,
    network: "ethereum-sepolia",
    token: "eth",
  });
  const balance = await publicClient.getBalance({ address: account.address });
  console.log("Alice address:", account.address);
  console.log("Alice Sepolia ETH balance (wei):", balance);
  return account;
}

async function getBobAccount() {
  const account = await cdp.evm.getOrCreateAccount({ name: "Bob" });
  await cdp.evm.requestFaucet({
    address: account.address,
    network: "ethereum-sepolia",
    token: "eth",
  });
  const balance = await publicClient.getBalance({ address: account.address });
  console.log("Bob address:", account.address);
  console.log("Bob Sepolia ETH balance (wei):", balance);
  return account;
}

export { loadDeployment, getContract, getAliceAccount, getBobAccount }; 