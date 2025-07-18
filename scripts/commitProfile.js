import { encodeFunctionData, createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import * as circomlib from "circomlibjs";
import { loadDeployment, getAliceAccount, getBobAccount } from "./utils.js";
import dotenv from "dotenv";

import { CdpClient } from "@coinbase/cdp-sdk"; // using cdp-sdk

dotenv.config();

const cdp = new CdpClient({
  apiKeyId: process.env.CDP_API_KEY_ID,
  apiKeySecret: process.env.CDP_API_KEY_SECRET,
  walletSecret: process.env.CDP_WALLET_SECRET,
});

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});

async function main() {
  // 1. generate commitment
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

  // 2. register commitment to profile registry
  const alice = await getAliceAccount();
  const profileDeployment = loadDeployment("ProfileRegistry");
  const registerProfileData = encodeFunctionData({
    abi: profileDeployment.abi,
    functionName: "registerProfile",
    args: [commitment],
  });

  // Debug: try a read-only call to see if it would revert
  try {
    const result = await publicClient.call({
      to: profileDeployment.address,
      data: registerProfileData,
      account: alice.address,
    });
    console.log("registerProfile call result:", result);
  } catch (err) {
    console.error("registerProfile call error:", err);
  }

  const profileTxHash = await cdp.evm.sendTransaction({
    address: alice.address,
    network: "ethereum-sepolia",
    transaction: {
      to: profileDeployment.address,
      data: registerProfileData,
    },
  });
  console.log("Profile Committed. Transaction hash:", profileTxHash);

  // 3. register preferences to preferences registry

  // TODO: example preferences
  const minAge = 18;
  const maxAge = 35;
  const acceptedGenders = [1, 2, 3];
  const desiredLocation = 12;
  const desiredOccupation = 3;
  const desiredHobby = 5;
  // note: example profile is a match

  const bob = await getBobAccount();
  const preferencesDeployment = loadDeployment("PreferencesRegistry");
  const setPreferencesData = encodeFunctionData({
    abi: preferencesDeployment.abi,
    functionName: "setPreferences",
    args: [minAge, maxAge, acceptedGenders, desiredLocation, desiredOccupation, desiredHobby],
  });
  const prefsTxHash = await cdp.evm.sendTransaction({
    address: bob.address,
    network: "ethereum-sepolia",
    transaction: {
      to: preferencesDeployment.address,
      data: setPreferencesData,
    },
  });
  console.log("Preferences Registered. Transaction hash:", prefsTxHash);
}

main();
