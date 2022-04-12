// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import 
"../lib/LoanLibrary.sol";


interface ICoreLoan {
  // Function
  function createLoan(LoanLibrary.LoanTerms calldata loanTerms)
    external
    returns (uint256 loanId);


  // events
  event createLoan(LoanLibrary.LoanTerms loanTerms, uint256 loandId) 
}
