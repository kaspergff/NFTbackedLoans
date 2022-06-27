import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";
import hre from "hardhat";
import { LoanTerms } from "./types";
import { Loan } from "../../typechain";
import { expect } from "chai";
import { mintERC721 } from "./testERC721";
import { TestERC721 } from "../../typechain/TestERC721.d";

function getLastWeeksDate() {
    const now = new Date();
    const date = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 7
    ).getTime();
    return date;
}

export const generateLoanTerms = ({
    duration = BigNumber.from(10000),
    collateralId = BigNumber.from(10),
    collateralAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9", // hardcoded
    loanAmount = hre.ethers.utils.parseEther("100"),
    interestAmount = hre.ethers.utils.parseEther("3.5"),
    startTimestamp = BigNumber.from(getLastWeeksDate()),
}): LoanTerms => {
    return {
        duration,
        collateralId,
        collateralAddress,
        loanAmount,
        interestAmount,
        startTimestamp,
    };
};

export const generateLoanTerms2 = (
    collateralId: BigNumber,
    collateralAddress: string,
    {
        duration = BigNumber.from(10000),
        loanAmount = hre.ethers.utils.parseEther("10"),
        interestAmount = hre.ethers.utils.parseEther("3.5"),
        startTimestamp = BigNumber.from(getLastWeeksDate()),
    }
): LoanTerms => {
    return {
        duration,
        collateralId,
        collateralAddress,
        loanAmount,
        interestAmount,
        startTimestamp,
    };
};

export const requestLoan = async (
    loanTerms: LoanTerms,
    user: SignerWithAddress,
    testERC721: TestERC721,
    LoanContract: Loan
) => {
    // approve
    await testERC721
        .connect(user)
        .approve(LoanContract.address, loanTerms.collateralId);

    const tx = await LoanContract.connect(user).createLoan(loanTerms);
    const receipt = await tx.wait();

    if (
        receipt &&
        receipt.events &&
        // receipt.events.length === 1 &&
        receipt.events[receipt.events.length - 1].args
    ) {
        return receipt.events[receipt.events.length - 1].args?.loanId;
    } else {
        throw new Error("Unable to initialize loan");
    }
};

export const requestLoanWithArgs = async (
    loanTerms: LoanTerms,
    user: SignerWithAddress,
    testERC721: TestERC721,
    LoanContract: Loan
) => {
    // approve
    await testERC721
        .connect(user)
        .approve(LoanContract.address, loanTerms.collateralId);

    const tx = await LoanContract.connect(user).createLoan(loanTerms);
    const receipt = await tx.wait();

    if (
        receipt &&
        receipt.events &&
        // receipt.events.length === 1 &&
        receipt.events[receipt.events.length - 1].args
    ) {
        return receipt.events[receipt.events.length - 1].args;
        // return receipt.events[receipt.events.length - 1].args?.loanId;
    } else {
        throw new Error("Unable to initialize loan");
    }
};

export const checkTerms = (chain: LoanTerms, local: LoanTerms) => {
    expect(chain.duration).to.equal(local.duration);
    expect(chain.collateralId).to.equal(local.collateralId);
    expect(chain.loanAmount).to.equal(local.loanAmount);
    expect(chain.collateralAddress).to.equal(local.collateralAddress);
    expect(chain.interestAmount).to.equal(local.interestAmount);
    expect(chain.startTimestamp).to.equal(local.startTimestamp);
};

export const createAndAcceptLoan = async (
    borrower: SignerWithAddress,
    lender: SignerWithAddress,
    collateralAddress: string,
    LoanContract: Loan,
    erc721: TestERC721
) => {
    // create loan request
    const collateralId = await mintERC721(erc721, borrower);
    const loanTerms = generateLoanTerms({
        collateralId,
        collateralAddress,
    });

    const loanData = await requestLoanWithArgs(
        loanTerms,
        borrower,
        erc721,
        LoanContract
    );

    let loanAmount;
    let loanId;

    if (loanData) {
        loanAmount = loanData[0].loanAmount;
        loanId = loanData.loanId;

        // accept loan
        LoanContract.connect(lender).acceptLoan(loanId, {
            value: loanAmount,
        });
    } else throw new Error("loanData is undefined");

    const loanDataOnChain = await LoanContract.getLoan(loanId);
    return loanDataOnChain;
};
