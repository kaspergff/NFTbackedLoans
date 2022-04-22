import { BigNumber } from "ethers";
import hre from "hardhat";

export interface LoanTerms {
    duration: BigNumber;
    collateralId: BigNumber;
    collateralAddress: string;
    loanAmount: BigNumber;
    interestRate: BigNumber;
}

export const generateLoanTerms = ({
    duration = BigNumber.from(10000),
    collateralId = BigNumber.from(10),
    collateralAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9", // hardcoded
    loanAmount = hre.ethers.utils.parseEther("100"),
    interestRate = hre.ethers.utils.parseEther("3.5"),
}): LoanTerms => {
    return {
        duration,
        collateralId,
        collateralAddress,
        loanAmount,
        interestRate,
    };
};
