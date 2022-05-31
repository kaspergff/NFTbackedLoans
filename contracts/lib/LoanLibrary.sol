// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
  Library describing the state of a loan
 */

library LoanLibrary {
    struct Loan {
        // State of the loan
        LoanState state;
        // Loan terms
        LoanTerms terms;
        // Borrower ID == nft??
        uint256 borrowerId;
        // Lender ID == nft??
        uint256 lenderId;
    }

    enum LoanState {
        Request,
        Accepted,
        Repaid,
        End,
        Cancelled
    }

    struct LoanTerms {
        // duration of the loan --> TO DO
        uint256 duration;
        // TokenID of the collateral
        uint256 collateralId;
        // adress of Collateral
        address collateralAddress;
        // amount of the loan in the currency
        uint256 loanAmount;
        // interest rate
        uint256 interestRate;
    }
}
