pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";

template CommitProfile() {
    // Private inputs: your profile attributes and a secret nonce
    signal input age;
    signal input gender;
    signal input location;
    signal input occupation;
    signal input hobby;
    signal input randomness;

    // Public output: the commitment hash
    signal output commitment;

    // Compute Poseidon hash of all private inputs
    component poseidonHasher = Poseidon(6);
    poseidonHasher.inputs[0] <== age;
    poseidonHasher.inputs[1] <== gender;
    poseidonHasher.inputs[2] <== location;
    poseidonHasher.inputs[3] <== occupation;
    poseidonHasher.inputs[4] <== hobby;
    poseidonHasher.inputs[5] <== randomness;

    commitment <== poseidonHasher.out;
}

component main = CommitProfile();
