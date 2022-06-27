import { BigNumber, Signer } from "ethers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Loan } from "../typechain";
import { TestERC721 } from "./../typechain/TestERC721.d";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { mintERC721, mintERC721_ } from "./util/testERC721";

import {
    checkTerms,
    createAndAcceptLoan,
    generateLoanTerms,
    generateLoanTerms2,
    requestLoan,
    requestLoanWithArgs,
} from "./util/util";

describe("Loan.sol Contract", () => {
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;
    let addrs: SignerWithAddress[];
    let TestERC721: TestERC721;
    let collateralAddress: string;
    let LoanContract: Loan;

    beforeEach(async () => {
        const loanFactory = await ethers.getContractFactory("Loan");
        LoanContract = await loanFactory.deploy();

        const testERC721ContractFactory = await ethers.getContractFactory(
            "TestERC721"
        );
        TestERC721 = await testERC721ContractFactory.deploy();

        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        collateralAddress = TestERC721.address;
    });

    describe("Deployment", () => {
        it("Should deploy the contract", async () => {
            expect(await LoanContract.counter()).to.equal(0);
        });
    });

    describe("Function CreateLoan", () => {
        it("Should create a loan Request", async () => {
            const collateralId = await mintERC721(TestERC721, addr1);
            const loanTerms = generateLoanTerms({
                collateralId,
                collateralAddress,
            });

            const loanId = await requestLoan(
                loanTerms,
                addr1,
                TestERC721,
                LoanContract
            );

            expect(loanId).to.equal(BigNumber.from(1));

            const loanDataOnChain = await LoanContract.getLoan(loanId);
            // state
            expect(loanDataOnChain.state).to.equal(0);
            // borrower id
            expect(loanDataOnChain.borrowerId).to.equal(
                await addr1.getAddress()
            );
            // lender id
            expect(loanDataOnChain.lenderId).to.equal(BigNumber.from(0));
            // terms
            checkTerms(loanDataOnChain.terms, loanTerms);

            // collateral transfer
            expect(await TestERC721.ownerOf(collateralId)).to.equal(
                LoanContract.address
            );
        });

        it("Should create multiple loan request", async () => {
            let loanIds = new Set();
            for (let i = 0; i < 5; i++) {
                const collateralId = await mintERC721(TestERC721, addr1);
                const loanTerms = generateLoanTerms2(
                    collateralId,
                    TestERC721.address,
                    {}
                );

                const loanId = await requestLoan(
                    loanTerms,
                    addr1,
                    TestERC721,
                    LoanContract
                );
                expect(loanIds.has(loanId)).to.be.false;
                loanIds.add(loanId);
            }

            expect(await LoanContract.counter()).to.equal(5);
            expect(await TestERC721.balanceOf(LoanContract.address)).to.equal(
                5
            );
        });

        it("Should emit de CreateLoan event", async () => {
            const collateralId = await mintERC721(TestERC721, addr1);
            const loanTerms = generateLoanTerms({
                collateralId,
                collateralAddress,
            });

            const approve = await TestERC721.connect(addr1).approve(
                LoanContract.address,
                collateralId
            );

            expect(
                await LoanContract.connect(addr1).createLoan(loanTerms)
            ).to.emit(LoanContract, "CreateLoan");
        });

        it("Should fail to initialize a loan if not approved", async () => {
            const collateralId = await mintERC721(TestERC721, addr1);
            const loanTerms = generateLoanTerms({
                collateralId,
                collateralAddress,
            });

            await expect(
                LoanContract.connect(addr1).createLoan(loanTerms)
            ).to.be.revertedWith(
                "ERC721: transfer caller is not owner nor approved"
            );
            expect(await TestERC721.ownerOf(collateralId)).to.equal(
                await addr1.getAddress()
            );
        });
    });

    describe("Function cancelLoan", () => {
        it("Should cancel a loan", async () => {
            const collateralId = await mintERC721(TestERC721, addr1);
            const loanTerms = generateLoanTerms({
                collateralId,
                collateralAddress,
            });

            const loanId = await requestLoan(
                loanTerms,
                addr1,
                TestERC721,
                LoanContract
            );
            expect(await TestERC721.ownerOf(collateralId)).to.equal(
                LoanContract.address
            );

            await LoanContract.connect(addr1).cancelLoan(loanId);

            expect(await TestERC721.ownerOf(collateralId)).to.equal(
                await addr1.getAddress()
            );
        });

        it("Should fail to cancel a loan that is not yours", async () => {
            const collateralId2 = await mintERC721(TestERC721, addr2);
            const loanTerms2 = generateLoanTerms2(
                collateralId2,
                TestERC721.address,
                {}
            );

            const loanId2 = await requestLoan(
                loanTerms2,
                addr2,
                TestERC721,
                LoanContract
            );

            await expect(
                LoanContract.connect(addr1).cancelLoan(loanId2)
            ).to.be.revertedWith("cancelLoan: Only cancel your own loan");
        });

        it("Should fail to cancel a loan if it is in the wrong state", async () => {
            const collateralId2 = await mintERC721(TestERC721, addr2);
            const loanTerms2 = generateLoanTerms2(
                collateralId2,
                TestERC721.address,
                {}
            );

            const loanId2 = await requestLoan(
                loanTerms2,
                addr2,
                TestERC721,
                LoanContract
            );
            await LoanContract.connect(addr2).cancelLoan(loanId2);

            await expect(
                LoanContract.connect(addr2).cancelLoan(loanId2)
            ).to.be.revertedWith(
                "cancelLoan: only cancel loan in Request state"
            );
        });
    });

    describe("AcceptLoan function", () => {
        it("Should accept a loan", async () => {
            // create loan request
            const collateralId = await mintERC721(TestERC721, addr1);
            const loanTerms = generateLoanTerms({
                collateralId,
                collateralAddress,
            });

            const loanData = await requestLoanWithArgs(
                loanTerms,
                addr1,
                TestERC721,
                LoanContract
            );

            let loanAmount;
            let loanId;

            if (loanData) {
                loanAmount = loanData[0].loanAmount;
                loanId = loanData.loanId;

                // accept loan
                LoanContract.connect(addr2).acceptLoan(loanId, {
                    value: loanAmount,
                });
            } else throw new Error("loanData is undefined");

            const loanDataOnChain = await LoanContract.getLoan(loanId);

            expect(loanDataOnChain.state).to.equal(1);
            expect(loanDataOnChain.borrowerId).to.equal(
                BigNumber.from(await addr1.getAddress())
            );
            expect(loanDataOnChain.lenderId).to.equal(
                BigNumber.from(await addr2.getAddress())
            );
            expect(loanDataOnChain.terms.loanAmount).to.equal(loanAmount);
        });

        it("Should transfer the correct amount of Eth REFACTOR", async () => {
            // create loan request

            const borrower = addrs[0];
            const lender = addrs[1];

            // console.log("Owner " + (await owner.getAddress()));
            const bal = await owner.getBalance();
            // console.log(bal);
            // console.log(bal.add(2272380));
            // console.log(bal.add(2381986));

            // console.log("borrower " + (await borrower.getAddress()));

            const balanceBorrower1 = await borrower.getBalance();

            const ownerBalance = await owner.getBalance();
            // console.log("Owner " + ownerBalance);

            const [collateralId, mintReceipt] = await mintERC721_(
                TestERC721,
                borrower
            );
            // console.log(mintReceipt);

            const loanTerms = generateLoanTerms({
                collateralId,
                collateralAddress,
            });
            const tx0 = await TestERC721.connect(borrower).approve(
                LoanContract.address,
                loanTerms.collateralId
            );

            const tx = await LoanContract.connect(borrower).createLoan(
                loanTerms
            );
            const receipt = await tx.wait();

            const balanceBorrower = await borrower.getBalance();
            // console.log(balanceBorrower);

            let loanData;

            if (
                receipt &&
                receipt.events &&
                // receipt.events.length === 1 &&
                receipt.events[receipt.events.length - 1].args
            ) {
                loanData = receipt.events[receipt.events.length - 1].args;
                // return receipt.events[receipt.events.length - 1].args?.loanId;
            } else {
                throw new Error("Unable to initialize loan");
            }
            let loanAmount: BigNumber;
            let loanId;
            let tx2;
            let receipt2;

            if (loanData) {
                loanAmount = loanData[0].loanAmount;
                loanId = loanData.loanId;

                // accept loan
                tx2 = await LoanContract.connect(lender).acceptLoan(loanId, {
                    value: loanAmount,
                });
                receipt2 = await tx2.wait();
            } else throw new Error("loanData is undefined");
        });
    });

    describe("payBackLoan function", () => {
        it("Should payback a loan", async () => {
            const loanDataOnChain = await createAndAcceptLoan(
                addr1,
                addr2,
                collateralAddress,
                LoanContract,
                TestERC721
            );

            expect(loanDataOnChain.state).to.equal(1);
            expect(loanDataOnChain.borrowerId).to.equal(
                BigNumber.from(await addr1.getAddress())
            );
            expect(loanDataOnChain.lenderId).to.equal(
                BigNumber.from(await addr2.getAddress())
            );
            const loanAmount = loanDataOnChain.terms.loanAmount;
            const interestAmount = loanDataOnChain.terms.interestAmount;
            const payBackAmount = await LoanContract.getPayBackAmount(
                BigNumber.from(1)
            );
            expect(loanAmount.add(interestAmount)).to.equal(payBackAmount);

            // pay back loan
            await LoanContract.connect(addr1).payBackLoan(BigNumber.from(1), {
                value: payBackAmount,
            });

            const newLoanData = await LoanContract.getLoan(1);
            expect(newLoanData.state).to.equal(2);
        });
    });
});
