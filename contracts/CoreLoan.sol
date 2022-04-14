// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// imports
// Openzeppelin
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// lib
import "./lib/LoanLibrary.sol";

/**
    @dev Base contract of a NFT backed loan
      This contract tracks al loans
 */

contract CoreLoan is AccessControl {
    using Counters for Counters.Counter;
    using SafeMath for uint256;
    // Counters
    Counters.Counter private loanIDs;

    // Roles
    bytes32 public constant CONTROLLER_ROLE = keccak256("CONTROLLER_ROLE");

    // Mappings
    // ids of the loans
    mapping(uint256 => LoanLibrary.Loan) private loans;
    // track the colleterals in use
    mapping(uint256 => bool) private usedCollateral;

    // events
    event CreateLoan(LoanLibrary.LoanTerms loanTerms, uint256 loandId);

    constructor() {
        // Base admin -> can also revoke its own role
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function createLoan(LoanLibrary.LoanTerms calldata loanTerms)
        external
        onlyRole(CONTROLLER_ROLE)
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
            LoanLibrary.LoanState.Request,
            // Loan terms
            loanTerms,
            // Borrower ID. When the loan starts this gets filled in.
            uint256(uint160(msg.sender)),
            // Lender ID. When the loan starts this gets filled in.
            0
        );
        usedCollateral[loanTerms.collateralId] = true;
        emit CreateLoan(loanTerms, loanId);
    }

    function activateLoan(
        address lender,
        address borrower,
        uint256 loanId
    ) external onlyRole(CONTROLLER_ROLE) {
        LoanLibrary.Loan memory loanData = loans[loanId];

        require(loanData.state == LoanLibrary.LoanState.Request, "Wrong state");
    }
}
