// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// solhint-disable-next-line func-visibility
function addressToUint256(address addr) pure returns (uint256) {
    return uint256(uint160(addr));
}
