// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./collateral/CollateralVault.sol";
import "./lib/LoanLibrary.sol";
import "./CoreLoan.sol";

contract FactoryCollateralVault is ERC721Enumerable {
    address public immutable collateralVault;
    address public immutable coreLoan;

    constructor(address _coreLoan, address _collateralVault)
        ERC721("Controller", "Con")
    {
        require(
            _coreLoan != address(0),
            "Controller:: CoreLoan is not defined"
        );
        coreLoan = _coreLoan;
        collateralVault = _collateralVault;
    }

    function createVault(address to) internal returns (address vault) {
        address newVault = Clones.clone(collateralVault);
        CollateralVault(newVault).initializeVault(to);
        // return uint256(uint160(newVault));
        return newVault;
    }

    // function that creates the loan request
    function createLoan(
        uint256 duration,
        address currency,
        uint256 amount,
        uint256 interestRate
    ) public {
        // Create vault with collateral
        address vault = createVault(msg.sender);
        LoanLibrary.LoanTerms memory terms = LoanLibrary.LoanTerms(
            duration,
            currency,
            uint256(uint160(vault)),
            amount,
            interestRate
        );

        initializeLoan(terms, msg.sender);
    }

    // function to start the loan and lock the collateral in a vault on chain
    function initializeLoan(
        LoanLibrary.LoanTerms memory loanTerms,
        address borrower
    ) public returns (uint256 loanId) {
        require(msg.sender == borrower, "Controller:: Wrong address borrower");

        // Create loan request
        loanId = CoreLoan(coreLoan).createLoan(loanTerms);

        // transfer vault to contract
        IERC721(address(uint160(uint256(loanTerms.collateralId)))).transferFrom(
                borrower,
                address(this),
                loanTerms.collateralId
            );
    }
}
