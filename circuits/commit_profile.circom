pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";

template CommitProfile() {

    // private inputs: age, gender, location, occupation, hobby, and a secret nonce
    signal input age;
    signal input gender;
    signal input location;
    signal input occupation;
    signal input hobby;
    signal input nonce; // hiding

    // public output: the commitment hash
    signal output commitment;

    // compute the posedion hashes of all private inputs to compute the commitment
    component profileHasher = Poseidon(6);
    profileHasher.inputs[0] <== age;
    profileHasher.inputs[1] <== gender;
    profileHasher.inputs[2] <== location;
    profileHasher.inputs[3] <== occupation;
    profileHasher.inputs[4] <== hobby;
    profileHasher.inputs[5] <== nonce;
    commitment <== profileHasher.out;
}

component main = CommitProfile();
