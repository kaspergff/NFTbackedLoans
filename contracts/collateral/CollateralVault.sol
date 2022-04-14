// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
// import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
// import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// contract that wraps ERC721 token in a vault
// a vault is an erc721 token
contract CollateralVault is ERC721Enumerable, ERC721Holder {
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    Counters.Counter private _vaultIdTracker;

    struct ERC721Vault {
        address token;
        uint256 tokenId;
    }
    mapping(uint256 => ERC721Vault[]) public erc721Vaults;

    // events
    event DepositERC721(
        address indexed depositor,
        uint256 indexed vaultId,
        address token,
        uint256 tokenId
    );
    event Withdraw(address user, uint256 vaultId);

    constructor(string memory name, string memory symbol)
        ERC721(name, symbol)
    {}

    function initializeVault(address to) external {
        _vaultIdTracker.increment();
        _safeMint(to, _vaultIdTracker.current());
    }

    function depositERC721(
        address token,
        uint256 tokenId,
        uint256 vaultId
    ) external {
        // checks
        require(_exists(vaultId), "Vault ID does not exist!");

        // transefer token
        IERC721(token).transferFrom(msg.sender, address(this), tokenId);

        // push to vault
        erc721Vaults[vaultId].push(ERC721Vault(token, tokenId));

        // event
        emit DepositERC721(msg.sender, vaultId, token, tokenId);
    }

    function withdraw(uint256 vaultId) external {
        require(_isApprovedOrOwner(msg.sender, vaultId), "Not the owner");

        // withdraw ERC721
        ERC721Vault[] memory _erc721Vaults = erc721Vaults[vaultId];
        for (uint256 i = 0; i < _erc721Vaults.length; i++) {
            IERC721(_erc721Vaults[i].token).safeTransferFrom(
                address(this),
                msg.sender,
                _erc721Vaults[i].tokenId
            );
        }
        delete erc721Vaults[vaultId];
        _burn(vaultId);

        emit Withdraw(msg.sender, vaultId);
    }
}
