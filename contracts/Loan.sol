// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// imports
// Openzeppelin
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

import "./utils.sol" as Util;

import "hardhat/console.sol";

// lib
import "./lib/LoanLibrary.sol";

contract Loan is AccessControl, ERC721Holder {
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    // Counters
    Counters.Counter private loanIDs;

    // Mappings
    // ids of the loans
    mapping(uint256 => LoanLibrary.Loan) private loans;
    // track the colleterals in use
    mapping(uint256 => bool) public usedCollateral;

    // events
    event CreateLoan(
        LoanLibrary.LoanTerms loanTerms,
        uint256 loanId,
        address borrower
    );
    event CancelLoan(uint256 loanId);
    event AcceptLoan(uint256 loanId, uint256 lenderId);

    constructor() {
        // Base admin -> can also revoke its own role
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
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

    // Loan functions
    function createLoan(LoanLibrary.LoanTerms calldata loanTerms)
        external
        returns (uint256 loanId)
    {
        // console.log(msg.sender);
        // console.log(
        //     IERC721(loanTerms.collateralAddress).ownerOf(loanTerms.collateralId)
        // );
        require(
            !usedCollateral[loanTerms.collateralId],
            "createLoan: Collateral allready in use"
        );
        require(
            IERC721(loanTerms.collateralAddress).ownerOf(
                loanTerms.collateralId
            ) == msg.sender,
            "createLoan: Wrong token address / collateral"
        );

        loanIDs.increment();
        loanId = loanIDs.current();

        // Create Loan
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

        // Transfer Collateral
        IERC721(loanTerms.collateralAddress).safeTransferFrom(
            msg.sender,
            address(this),
            loanTerms.collateralId
        );

        usedCollateral[loanTerms.collateralId] = true;

        emit CreateLoan(loanTerms, loanId, msg.sender);
    }

    function cancelLoan(uint256 loanId) external {
        LoanLibrary.Loan storage loan = loans[loanId];
        require(
            Util.addressToUint256(msg.sender) == loan.borrowerId,
            "cancelLoan: Only cancel your own loan"
        );
        require(
            loan.state == LoanLibrary.LoanState.Request,
            "cancelLoan: only cancel loan in Request state"
        );
        require(
            IERC721(loan.terms.collateralAddress).ownerOf(
                loan.terms.collateralId
            ) == address(this),
            "cancelLoan: Contract not owner of NFT"
        );

        loan.state = LoanLibrary.LoanState.Cancelled;
        usedCollateral[loan.terms.collateralId] = false;

        // transfer collateral back
        IERC721(loan.terms.collateralAddress).transferFrom(
            address(this),
            msg.sender,
            loan.terms.collateralId
        );

        emit CancelLoan(loanId);
    }

    function acceptLoan(uint256 loanId) external payable {
        LoanLibrary.Loan storage loanData = loans[loanId];
        uint256 lenderId = Util.addressToUint256(msg.sender);
        require(
            loanData.state == LoanLibrary.LoanState.Request,
            "AcceptLoan, Loan in wrong state"
        );
        require(
            lenderId != loanData.borrowerId,
            "AcceptLoan, Tried to accept own loan"
        );
        require(
            msg.value == loanData.terms.loanAmount,
            "AcceptLoan, msg.value not same as loanAmount"
        );

        loanData.lenderId = lenderId;
        loanData.state = LoanLibrary.LoanState.Accepted;

        // transfer Eth
        address borrower = address(uint160(uint256(loanData.borrowerId)));
        // solhint-disable-next-line avoid-low-level-calls
        (bool success, ) = borrower.call{value: loanData.terms.loanAmount}("");
        require(success, "AcceptLoan: Call Eth failed");

        emit AcceptLoan(loanId, Util.addressToUint256(msg.sender));
    }
}
