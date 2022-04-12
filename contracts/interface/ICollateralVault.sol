// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ICollateralVault {
    function initializeVault(address to) external;

    function depositERC721(
        address token,
        uint256 tokenId,
        uint256 vaultId
    ) external;

    event DepositERC721(
        address indexed depositor,
        uint256 indexed vaultId,
        address token,
        uint256 tokenId
    );

    function withdraw(uint256 vaultId) external;
    event Withdraw(address user, uint256 vaultId)
}
