pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";

// for comparators
include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/bitify.circom";

// a >= b check for n-bit numbers (non-negative)
template GreaterEq(n) {
    signal input in[2]; // where: in[0] = a and in[1] = b
    signal output out;

    signal diff;
    diff <== in[0] - in[1];
    // case #1:
    // a >= b -> a - b >= 0
    // case #2:
    // a < b -> a - b < 0
    // -> diff is a large number in the finite field (underflow) (+ does not fit in n bits)

    component bitsDecomp = Num2Bits(n);
    bitsDecomp.in <== diff;

    // bitsDecomp.out[n-1] = most significant bit (MSB) (left-most)
    // out = 1 - MSB:
    // out = 1 -> a >= b
    // out = 0 -> a < b
    out <== 1 - bitsDecomp.out[n-1];
}

// a <= b check using GreaterEq(b, a)
template LessEq(n) {
    signal input in[2];
    signal output out;

    component ge = GreaterEq(n);
    ge.in[0] <== in[1];
    ge.in[1] <== in[0];
    out <== ge.out;
}

template MatchProfile() {

    // private inputs:
    // profile information
    signal input age;
    signal input gender;
    signal input location;
    signal input occupation;
    signal input hobby;
    signal input nonce;

    // public inputs:

    // profile commitment from on-chain registry
    signal input commitment;

    // preferences from on-chain registry
    signal input min_age;
    signal input max_age;
    signal input accepted_genders[3];
    signal input desired_location;
    signal input desired_occupation;
    signal input desired_hobby;

    // ensure profile commitment matches
    component profileHasher = Poseidon(6);
    profileHasher.inputs[0] <== age;
    profileHasher.inputs[1] <== gender;
    profileHasher.inputs[2] <== location;
    profileHasher.inputs[3] <== occupation;
    profileHasher.inputs[4] <== hobby;
    profileHasher.inputs[5] <== nonce;
    profileHasher.out === commitment;

    // age checks
    component geMin = GreaterEq(8);
    geMin.in[0] <== age;
    geMin.in[1] <== min_age;

    component leMax = LessEq(8);
    leMax.in[0] <== age;
    leMax.in[1] <== max_age;

    // age within range: 1 * 1 = 1 (AND)
    (geMin.out * leMax.out) === 1;

    // gender checks
    component eq0 = IsEqual();
    eq0.in[0] <== gender;
    eq0.in[1] <== accepted_genders[0];

    component eq1 = IsEqual();
    eq1.in[0] <== gender;
    eq1.in[1] <== accepted_genders[1];

    component eq2 = IsEqual();
    eq2.in[0] <== gender;
    eq2.in[1] <== accepted_genders[2];

    // gender is accepted: i.e. 1 + 0 + 0 = 1 (OR)
    signal genderMatch;
    genderMatch <== eq0.out + eq1.out + eq2.out;
    genderMatch === 1;

    // location, occuptation, hobby checks
    location === desired_location;
    occupation === desired_occupation;
    hobby === desired_hobby;
}

component main {public [commitment, min_age, max_age, accepted_genders, desired_location, desired_occupation, desired_hobby]} = MatchProfile();
