import { BigNumber } from "ethers";

export interface LoanTerms {
    duration: BigNumber;
    collateralId: BigNumber;
    collateralAddress: string;
    loanAmount: BigNumber;
    interestAmount: BigNumber;
    startTimestamp: BigNumber;
}
