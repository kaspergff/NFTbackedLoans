// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./collateral/CollateralVault.sol";
import "./lib/LoanLibrary.sol";
import "./CoreLoan.sol";

// import "./utils.sol" as Util;

contract Controller is AccessControl {
    // address public immutable collateralVault;
    address public immutable coreLoan;

    constructor(address _coreLoan) {
        require(
            _coreLoan != address(0),
            "Controller:: CoreLoan is not defined"
        );
        coreLoan = _coreLoan;
    }

    event InitializeLoan(
        LoanLibrary.LoanTerms,
        address borrower,
        uint256 loanId
    );
    event PrematureCancelLoan(uint256 loanId);
    event AcceptLoan(uint256 loanId, uint256 lenderId);

    // function to start the loan and lock the collateral in a vault on chain
    function initializeLoan(
        LoanLibrary.LoanTerms memory loanTerms,
        address borrower,
        address token
    ) external returns (uint256 loanId) {
        require(msg.sender == borrower, "Controller:: Wrong address borrower");
        require(
            IERC721(token).ownerOf(loanTerms.collateralId) == msg.sender,
            "Controller:: initializeLoan, Wrong token address / collateral"
        );
        // Create loan request
        loanId = CoreLoan(coreLoan).createLoan(loanTerms, msg.sender);
        IERC721(token).transferFrom(
            msg.sender,
            address(this),
            loanTerms.collateralId
        );
        emit InitializeLoan(loanTerms, borrower, loanId);
    }

    function prematureCancelLoan(uint256 loanId) external {
        // get loan
        LoanLibrary.Loan memory loan = CoreLoan(coreLoan).getLoan(loanId);
        require(
            loan.borrowerId == Util.addressToUint256(msg.sender),
            "Controller:: prematureCancelLoan, only cancel your own loan"
        );

        // solhint-disable-next-line reason-string
        require(
            loan.state == LoanLibrary.LoanState.Request,
            "Controller:: prematureCancelLoan, only cancel loan in Request state"
        );
        // cancle in CoreLoan
        CoreLoan(coreLoan).cancelLoan(loanId, msg.sender);

        // transfer vault back to user
        IERC721(loan.terms.collateralAddress).transferFrom(
            address(this),
            msg.sender,
            loan.terms.collateralId
        );

        emit PrematureCancelLoan(loanId);
    }

    function acceptLoan(uint256 loanId) external payable {
        LoanLibrary.Loan memory loan = CoreLoan(coreLoan).getLoan(loanId);
        require(
            loan.state == LoanLibrary.LoanState.Request,
            "Controller:: acceptLoan, loan is not in Request state"
        );
        require(
            Util.addressToUint256(msg.sender) != loan.borrowerId,
            "Controller:: acceptLoan, Cant take your own loan"
        );
        require(
            msg.value == loan.terms.loanAmount,
            "Controller:: acceptLoan, msg.value not same as loanAmount"
        );
        address borrower = address(uint160(uint256(loan.borrowerId)));
        // solhint-disable-next-line
        (bool success, ) = borrower.call{value: loan.terms.loanAmount}("");
        require(success, "Controller:: acceptLoan, Call Eth failed");

        CoreLoan(coreLoan).acceptLoan(msg.sender, loanId);
        emit AcceptLoan(loanId, Util.addressToUint256(msg.sender));
    }
}
