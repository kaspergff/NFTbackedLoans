// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// imports
// Openzeppelin
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// lib
import "./lib/LoanLibrary.sol";

// interface
import "./interface/ICoreLoan.sol";

/**
    @dev Base contract of a NFT backed loan
      This contract tracks al loans
 */

contract CoreLoan is AccessControl, ICoreLoan {
    using Counters for Counters.Counter;
    using SafeMath for uint256;
    // Counters
    Counters.Counter private loanIDs;

    // Mappings
    // ids of the loans
    mapping(uint256 => LoanLibrary.Loan) private loans;
    // track the colleterals in use
    mapping(uint256 => bool) private usedCollateral;

    constructor() {
        // Base admin -> can also revoke its own role
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    function createLoan(LoanLibrary.LoanTerms calldata loanTerms)
        external
        returns (uint256 loanId)
    {
        // require
        require(
            !usedCollateral[loanTerms.collateralId],
            "Collateral allready used"
        );

        loanIDs.increment();
        loanId = loanIDs.current();

        loans[loanId] = LoanLibrary.Loan(
            // State of the loan
            LoanLibrary.LoanState.Create,
            // Loan terms
            loanTerms,
            // Borrower ID. When the loan starts this gets filled in.
            0,
            // Lender ID. When the loan starts this gets filled in.
            0
        );
        usedCollateral[loanTerms.collateralId] = true;
        emit loanCreated(loanTerms, loanId);
    }
}
