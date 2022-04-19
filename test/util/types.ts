import { BigNumber } from "ethers";

export interface LoanTerms {
    duration: BigNumber;
    collateralId: BigNumber;
    loanAmount: BigNumber;
    interestRate: BigNumber;
}
