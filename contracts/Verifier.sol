// SPDX-License-Identifier: GPL-3.0
/*
    Copyright 2021 0KIMS association.

    This file is generated with [snarkJS](https://github.com/iden3/snarkjs).

    snarkJS is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    snarkJS is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with snarkJS. If not, see <https://www.gnu.org/licenses/>.
*/

pragma solidity >=0.7.0 <0.9.0;

contract Groth16Verifier {
    // Scalar field size
    uint256 constant r    = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    // Base field size
    uint256 constant q   = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    // Verification Key data
    uint256 constant alphax  = 9599764782781291692553539867861366266586211441774869949011453488991456497587;
    uint256 constant alphay  = 9027507453971123247094539067688869877208086461362127216726136817096914161491;
    uint256 constant betax1  = 7555435368714293525073943782217052126417419731785037778962874591514093091570;
    uint256 constant betax2  = 11481682364593555421159457917788257258725119748203169517103792716389999326165;
    uint256 constant betay1  = 6869533669916729700893088140771513544266544472965117725006965812400457795957;
    uint256 constant betay2  = 11103331688337373327629564785751206451292681183731528844740918430620100382883;
    uint256 constant gammax1 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant gammax2 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant gammay1 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant gammay2 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant deltax1 = 13853088993609644261572077537832726530220296682999051486492809888077115692164;
    uint256 constant deltax2 = 1692159261917712720541310601361075290646740377179629030440671434752258585420;
    uint256 constant deltay1 = 18475905696034544316608398456178347634511766633547003306525393109729217676533;
    uint256 constant deltay2 = 14258037162604811707771140335788227997149758516955528703250163967275180106307;

    
    uint256 constant IC0x = 6521287588264266280251158383835222647942900628158729150519222396398842283264;
    uint256 constant IC0y = 2373773239888213267866994556789574579602391492194923382271070570929089170487;
    
    uint256 constant IC1x = 2546708288702909096749815083070780357149514642790050931325592366275492354868;
    uint256 constant IC1y = 21043798474119276466213508406469443302182310245370245153755358001695682157735;
    
    uint256 constant IC2x = 10216835525513472042233861504796956331238414216666101981606766960099060398064;
    uint256 constant IC2y = 11774112831879276761175251209986472329657243161411690768843483662031011147035;
    
    uint256 constant IC3x = 5581153634152359036908213922713440845703010894706489790861935522493066297232;
    uint256 constant IC3y = 2122986692045499260348817155612148591238504616396990802649136231484307765556;
    
    uint256 constant IC4x = 11098110986637353271689833554774317530030945429843240141979589658695528840213;
    uint256 constant IC4y = 9927889413447390623250257417342121738240345306830635360486197432094576395419;
    
    uint256 constant IC5x = 18434399572938600229316679194668363364897911287260249917394694940940567286441;
    uint256 constant IC5y = 8828469190381194060985869141198177579162430226323080538177995919115850635229;
    
    uint256 constant IC6x = 14467723612574201403437913224167085111912020545259078825812187297035368193866;
    uint256 constant IC6y = 18538061190078193593091084463779979698810394772366109909368802644297925337848;
    
    uint256 constant IC7x = 3789308868863927615369696711457524627744790477866682586193869388016417941952;
    uint256 constant IC7y = 11150742933919620648402005820081044002263163544587036713042943873451324469169;
    
    uint256 constant IC8x = 7199688402213271841661302976886773207182663828548905599266303143650799494714;
    uint256 constant IC8y = 5041851346443056110180879658605128182030084632434269266932008220405110943775;
    
    uint256 constant IC9x = 19899222771883323782206334634237611084457695149417984591346620684725388114959;
    uint256 constant IC9y = 5869946138244310471863694816685722276824536029511989754505693379317993757764;
    
 
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[9] calldata _pubSignals) public view returns (bool) {
        assembly {
            function checkField(v) {
                if iszero(lt(v, r)) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }
            
            // G1 function to multiply a G1 value(x,y) to value in an address
            function g1_mulAccC(pR, x, y, s) {
                let success
                let mIn := mload(0x40)
                mstore(mIn, x)
                mstore(add(mIn, 32), y)
                mstore(add(mIn, 64), s)

                success := staticcall(sub(gas(), 2000), 7, mIn, 96, mIn, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }

                mstore(add(mIn, 64), mload(pR))
                mstore(add(mIn, 96), mload(add(pR, 32)))

                success := staticcall(sub(gas(), 2000), 6, mIn, 128, pR, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }

            function checkPairing(pA, pB, pC, pubSignals, pMem) -> isOk {
                let _pPairing := add(pMem, pPairing)
                let _pVk := add(pMem, pVk)

                mstore(_pVk, IC0x)
                mstore(add(_pVk, 32), IC0y)

                // Compute the linear combination vk_x
                
                g1_mulAccC(_pVk, IC1x, IC1y, calldataload(add(pubSignals, 0)))
                
                g1_mulAccC(_pVk, IC2x, IC2y, calldataload(add(pubSignals, 32)))
                
                g1_mulAccC(_pVk, IC3x, IC3y, calldataload(add(pubSignals, 64)))
                
                g1_mulAccC(_pVk, IC4x, IC4y, calldataload(add(pubSignals, 96)))
                
                g1_mulAccC(_pVk, IC5x, IC5y, calldataload(add(pubSignals, 128)))
                
                g1_mulAccC(_pVk, IC6x, IC6y, calldataload(add(pubSignals, 160)))
                
                g1_mulAccC(_pVk, IC7x, IC7y, calldataload(add(pubSignals, 192)))
                
                g1_mulAccC(_pVk, IC8x, IC8y, calldataload(add(pubSignals, 224)))
                
                g1_mulAccC(_pVk, IC9x, IC9y, calldataload(add(pubSignals, 256)))
                

                // -A
                mstore(_pPairing, calldataload(pA))
                mstore(add(_pPairing, 32), mod(sub(q, calldataload(add(pA, 32))), q))

                // B
                mstore(add(_pPairing, 64), calldataload(pB))
                mstore(add(_pPairing, 96), calldataload(add(pB, 32)))
                mstore(add(_pPairing, 128), calldataload(add(pB, 64)))
                mstore(add(_pPairing, 160), calldataload(add(pB, 96)))

                // alpha1
                mstore(add(_pPairing, 192), alphax)
                mstore(add(_pPairing, 224), alphay)

                // beta2
                mstore(add(_pPairing, 256), betax1)
                mstore(add(_pPairing, 288), betax2)
                mstore(add(_pPairing, 320), betay1)
                mstore(add(_pPairing, 352), betay2)

                // vk_x
                mstore(add(_pPairing, 384), mload(add(pMem, pVk)))
                mstore(add(_pPairing, 416), mload(add(pMem, add(pVk, 32))))


                // gamma2
                mstore(add(_pPairing, 448), gammax1)
                mstore(add(_pPairing, 480), gammax2)
                mstore(add(_pPairing, 512), gammay1)
                mstore(add(_pPairing, 544), gammay2)

                // C
                mstore(add(_pPairing, 576), calldataload(pC))
                mstore(add(_pPairing, 608), calldataload(add(pC, 32)))

                // delta2
                mstore(add(_pPairing, 640), deltax1)
                mstore(add(_pPairing, 672), deltax2)
                mstore(add(_pPairing, 704), deltay1)
                mstore(add(_pPairing, 736), deltay2)


                let success := staticcall(sub(gas(), 2000), 8, _pPairing, 768, _pPairing, 0x20)

                isOk := and(success, mload(_pPairing))
            }

            let pMem := mload(0x40)
            mstore(0x40, add(pMem, pLastMem))

            // Validate that all evaluations ∈ F
            
            checkField(calldataload(add(_pubSignals, 0)))
            
            checkField(calldataload(add(_pubSignals, 32)))
            
            checkField(calldataload(add(_pubSignals, 64)))
            
            checkField(calldataload(add(_pubSignals, 96)))
            
            checkField(calldataload(add(_pubSignals, 128)))
            
            checkField(calldataload(add(_pubSignals, 160)))
            
            checkField(calldataload(add(_pubSignals, 192)))
            
            checkField(calldataload(add(_pubSignals, 224)))
            
            checkField(calldataload(add(_pubSignals, 256)))
            

            // Validate all evaluations
            let isValid := checkPairing(_pA, _pB, _pC, _pubSignals, pMem)

            mstore(0, isValid)
             return(0, 0x20)
         }
     }
 }
