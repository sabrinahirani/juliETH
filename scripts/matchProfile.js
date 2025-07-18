import * as circomlib from "circomlibjs";
import * as snarkjs from "snarkjs";
import { encodeFunctionData, decodeFunctionResult, createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { loadDeployment, getAliceAccount, getBobAccount } from "./utils.js";
import dotenv from "dotenv";
import fs from "fs";

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

  // 1. generate proof:

  // 1.1 generate commitment

  const poseidon = await circomlib.buildPoseidon();
  const F = poseidon.F;

  // same example profile
  const age = Number(21);
  const gender = Number(1);
  const location = Number(12);
  const occupation = Number(3);
  const hobby = Number(5);
  const nonce = Number(123456); // same nonce

  const hash = poseidon([age, gender, location, occupation, hobby, nonce]);
  const commitment = F.toString(hash);

  console.log("Commitment (as decimal string):", commitment);

  // 1.2 some setup
  const alice = await getAliceAccount();
  const bob = await getBobAccount();
  const preferencesDeployment = loadDeployment("PreferencesRegistry");
  const matchDeployment = loadDeployment("MatchRegistry");

  // 1.3 construct input

  // same preferences
  const min_age = Number(18);
  const max_age = Number(35);
  const accepted_genders = [1, 2, 3];
  const desired_location = Number(12);
  const desired_occupation = Number(3);
  const desired_hobby = Number(5);

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
    desired_location,
    desired_occupation,
    desired_hobby,
  };

  // load wasm and zkey
  const wasmPath = "build/match_profile_js/match_profile.wasm";
  const zkeyPath = "build/match_profile_final.zkey";

  // 1.5 actually finally generate proof

  // generate proof
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    wasmPath,
    zkeyPath
  );

  console.log("Proof generated. ");

  // save proof
  fs.writeFileSync("proof.json", JSON.stringify(proof, null, 2));
  fs.writeFileSync("publicSignals.json", JSON.stringify(publicSignals, null, 2));

  // format for smart contract
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

  // 2. verify in match registry
  const verifyMatchData = encodeFunctionData({
    abi: matchDeployment.abi,
    functionName: "verifyMatch",
    args: [bob.address, a, b, c],
  });
  
  const txResult = await cdp.evm.sendTransaction({
    address: alice.address,
    network: "ethereum-sepolia",
    transaction: {
      to: matchDeployment.address,
      data: verifyMatchData,
    },
  });
  
  console.log("verifyMatch transaction result:", txResult);
  const txHash = txResult.transactionHash;
  console.log("Submitted tx hash:", txHash);
  
  // wait for confirmation
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });
  
  console.log("Transaction confirmed in block:", receipt.blockNumber);
  
  // now check match registry
  const getMatchesData = encodeFunctionData({
    abi: matchDeployment.abi,
    functionName: "getMatches",
    args: [bob.address],
  });
  
  const matchesResult = await publicClient.call({
    to: matchDeployment.address,
    data: getMatchesData,
    account: alice.address
  });
  
  let decoded = decodeFunctionResult({
    abi: matchDeployment.abi,
    functionName: "getMatches",
    data: matchesResult.data,
  });
  
  // handle different formats
  let matchedAddresses = decoded[0]; 
  if (!Array.isArray(matchedAddresses)) {
    matchedAddresses = [matchedAddresses]; 
  }
  
  const isMatched = matchedAddresses
    .map(addr => addr.toLowerCase())
    .includes(alice.address.toLowerCase());
  
  if (isMatched) {
    console.log(`Alice (${alice.address}) is now matched with Bob (${bob.address})!`);
  } else {
    console.log(`Alice is NOT matched with Bob.`);
  }
}

main();