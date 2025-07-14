pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/bitify.circom";
include "circomlib/circuits/comparators.circom";

// a >= b check for n-bit numbers
template GreaterEq(n) {
    signal input in[2]; // in[0] = a, in[1] = b
    signal output out;

    signal diff;
    diff <== in[0] - in[1];

    component bitsDecomp = Num2Bits(n);
    bitsDecomp.in <== diff;

    // highest bit is sign bit; 0 means non-negative => a >= b
    out <== 1 - bitsDecomp.out[n-1];
}

// a <= b via GreaterEq(b, a)
template LessEq(n) {
    signal input in[2];
    signal output out;

    component ge = GreaterEq(n);
    ge.in[0] <== in[1];
    ge.in[1] <== in[0];
    out <== ge.out;
}

template MatchProfile() {

    signal input preferencesHash;

    // Compute hash of public preferences
    component prefsHasher = Poseidon(7);
    prefsHasher.inputs[0] <== min_age;
    prefsHasher.inputs[1] <== max_age;
    prefsHasher.inputs[2] <== accepted_genders[0];
    prefsHasher.inputs[3] <== accepted_genders[1];
    prefsHasher.inputs[4] <== accepted_genders[2];
    prefsHasher.inputs[5] <== target_location;
    prefsHasher.inputs[6] <== target_occupation + target_hobby; // or separate as needed

    prefsHasher.out === preferencesHash;

    // Private inputs
    signal input age;
    signal input gender;
    signal input location;
    signal input occupation;
    signal input hobby;
    signal input randomness;

    // Public inputs
    signal input commitment;
    signal input min_age;
    signal input max_age;
    signal input accepted_genders[3];
    signal input target_location;
    signal input target_occupation;
    signal input target_hobby;

    // Recompute commitment
    component poseidonHasher = Poseidon(6);
    poseidonHasher.inputs[0] <== age;
    poseidonHasher.inputs[1] <== gender;
    poseidonHasher.inputs[2] <== location;
    poseidonHasher.inputs[3] <== occupation;
    poseidonHasher.inputs[4] <== hobby;
    poseidonHasher.inputs[5] <== randomness;

    poseidonHasher.out === commitment;

    // Age checks
    component geMin = GreaterEq(8);
    geMin.in[0] <== age;
    geMin.in[1] <== min_age;

    component leMax = LessEq(8);
    leMax.in[0] <== age;
    leMax.in[1] <== max_age;

    // Gender equality checks
    component eq0 = IsEqual();
    eq0.in[0] <== gender;
    eq0.in[1] <== accepted_genders[0];

    component eq1 = IsEqual();
    eq1.in[0] <== gender;
    eq1.in[1] <== accepted_genders[1];

    component eq2 = IsEqual();
    eq2.in[0] <== gender;
    eq2.in[1] <== accepted_genders[2];

    signal genderMatch;
    genderMatch <== eq0.out + eq1.out + eq2.out;
    genderMatch === 1;

    // Exact matches for location, occupation, hobby
    location === target_location;
    occupation === target_occupation;
    hobby === target_hobby;

    // Final match condition: age within range
    (geMin.out * leMax.out) === 1;
}

component main = MatchProfile();
