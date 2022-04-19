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
    mapping(uint256 => bool) public usedCollateral;

    // events
    event CreateLoan(LoanLibrary.LoanTerms loanTerms, uint256 loanId);
    event CancelLoan(uint256 loanId);
    event AcceptLoan(uint256 loanId, uint256 lenderId);
    event RepayLoan(uint256 loanId);

    constructor() {
        // Base admin -> can also revoke its own role
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // helpers

    function addressToUint256(address addr) private pure returns (uint256) {
        return uint256(uint160(addr));
    }

    function counter() external view returns (uint256) {
        return loanIDs.current();
    }

    function getLoan(uint256 loanId)
        public
        view
        returns (LoanLibrary.Loan memory loan)
    {
        return loans[loanId];
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
            // Lender ID. When the loan is accepted this gets filled in.
            0
        );

        usedCollateral[loanTerms.collateralId] = true;
        emit CreateLoan(loanTerms, loanId);
    }

    // function to cancel loan before it is accepted
    function cancelLoan(uint256 loanId)
        external
        onlyRole(CONTROLLER_ROLE)
        returns (bool)
    {
        // LoanLibrary.Loan memory loan = getLoan(loanId);
        LoanLibrary.Loan storage loan = loans[loanId];
        require(
            addressToUint256(msg.sender) == loan.borrowerId,
            "CoreLoan:: function cancelLoan. Only cancel your own loan"
        );
        require(
            loan.state == LoanLibrary.LoanState.Request,
            "CoreLoan:: function cancelLoan. Only cancel non accepted loan"
        );
        loan.state = LoanLibrary.LoanState.Cancelled;
        usedCollateral[loan.terms.collateralId] = false;
        emit CancelLoan(loanId);
        bool succes = true;
        return succes;
    }

    function acceptLoan(address lender, uint256 loanId)
        external
        onlyRole(CONTROLLER_ROLE)
    {
        LoanLibrary.Loan storage loanData = loans[loanId];
        uint256 lenderId = addressToUint256(lender);
        require(
            loanData.state == LoanLibrary.LoanState.Request,
            "CoreLoan:: function acceptLoan, Wrong state"
        );
        require(
            msg.sender == lender,
            "CoreLoan:: function acceptLoan, user error"
        );
        require(
            lenderId != loanData.borrowerId,
            "CoreLoan:: function acceptLoan, Tried to accept own loan"
        );

        loanData.lenderId = lenderId;
        loanData.state = LoanLibrary.LoanState.Accepted;
        emit AcceptLoan(loanId, lenderId);
    }

    // Time check
    function repayLoan(uint256 loanId) external onlyRole(CONTROLLER_ROLE) {
        LoanLibrary.Loan storage loanData = loans[loanId];
        require(
            loanData.state == LoanLibrary.LoanState.Accepted,
            "CoreLoan:: function repayLoan, Wrong state"
        );
        require(
            addressToUint256(msg.sender) == loanData.borrowerId,
            "CoreLoan:: function repayLoan, Borrower needs to pay back"
        );

        loanData.state = LoanLibrary.LoanState.Repaid;
        usedCollateral[loanData.terms.collateralId] = false;
        emit RepayLoan(loanId);
    }
}
