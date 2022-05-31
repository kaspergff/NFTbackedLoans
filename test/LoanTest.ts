import { BigNumber, Signer } from "ethers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Loan } from "../typechain";
import { TestERC721 } from "./../typechain/TestERC721.d";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { mintERC721 } from "./util/testERC721";
import { LoanTerms, generateLoanTerms, generateLoanTerms2 } from "./util/types";

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

    const requestLoan = async (
        collateralId: BigNumber,
        loanTerms: LoanTerms,
        user: SignerWithAddress,
        TestERC721: TestERC721
    ) => {
        // approve
        await TestERC721.connect(user).approve(
            LoanContract.address,
            collateralId
        );

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

    const checkTerms = (chain: LoanTerms, local: LoanTerms) => {
        expect(chain.duration).to.equal(local.duration);
        expect(chain.collateralId).to.equal(local.collateralId);
        expect(chain.loanAmount).to.equal(local.loanAmount);
        expect(chain.collateralAddress).to.equal(local.collateralAddress);
        expect(chain.interestRate).to.equal(local.interestRate);
    };

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
                collateralId,
                loanTerms,
                addr1,
                TestERC721
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
            const collateralId1 = await mintERC721(TestERC721, addr1);
            const loanTerms1 = generateLoanTerms2(
                collateralId1,
                TestERC721.address,
                {}
            );

            const loanId1 = await requestLoan(
                collateralId1,
                loanTerms1,
                addr1,
                TestERC721
            );

            const collateralId2 = await mintERC721(TestERC721, addr1);
            const loanTerms2 = generateLoanTerms2(
                collateralId2,
                TestERC721.address,
                {}
            );

            const loanId2 = await requestLoan(
                collateralId2,
                loanTerms2,
                addr1,
                TestERC721
            );

            const collateralId3 = await mintERC721(TestERC721, addr1);
            const loanTerms3 = generateLoanTerms2(
                collateralId3,
                TestERC721.address,
                {}
            );

            const loanId3 = await requestLoan(
                collateralId3,
                loanTerms3,
                addr1,
                TestERC721
            );
            expect(await LoanContract.counter()).to.equal(3);
            expect(await TestERC721.balanceOf(LoanContract.address)).to.equal(
                3
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
                collateralId,
                loanTerms,
                addr1,
                TestERC721
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
                collateralId2,
                loanTerms2,
                addr2,
                TestERC721
            );

            await expect(
                LoanContract.connect(addr1).cancelLoan(loanId2)
            ).to.be.revertedWith("cancelLoan: Only cancel your own loan");
        });

        it("Should fail to cancel a loan 2 times", async () => {
            const collateralId2 = await mintERC721(TestERC721, addr2);
            const loanTerms2 = generateLoanTerms2(
                collateralId2,
                TestERC721.address,
                {}
            );

            const loanId2 = await requestLoan(
                collateralId2,
                loanTerms2,
                addr2,
                TestERC721
            );
            await LoanContract.connect(addr2).cancelLoan(loanId2);

            await expect(
                LoanContract.connect(addr2).cancelLoan(loanId2)
            ).to.be.revertedWith(
                "cancelLoan: only cancel loan in Request state"
            );
        });
    });
});
