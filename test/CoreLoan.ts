// import { expect } from "chai";
// import { BigNumber, Signer } from "ethers";
// import hre, { ethers, waffle } from "hardhat";
// import { mintERC721 } from "./util/testERC721";
// import { LoanTerms, generateLoanTerms } from "./util/types";

// const { loadFixture } = waffle;
// const zero = hre.ethers.utils.parseUnits("0", 18);
// const CONTROLLER_ROLE =
//     "0x7b765e0e932d348852a6f810bfa1ab891e259123f02db8cdcde614c570223357";

// describe("CoreLoan ", async () => {
//     const fixture = async () => {
//         const signers = await hre.ethers.getSigners();
//         const factory = await ethers.getContractFactory("CoreLoan");
//         const coreLoan = await factory.deploy();

//         const testERC721ContractFactory = await ethers.getContractFactory(
//             "TestERC721"
//         );
//         const testERC721 = await testERC721ContractFactory.deploy();

//         const admin = signers[0];
//         const user2 = signers[1];
//         const controller = signers[2];
//         await coreLoan
//             .connect(admin)
//             .grantRole(CONTROLLER_ROLE, await admin.getAddress());
//         await coreLoan
//             .connect(admin)
//             .grantRole(CONTROLLER_ROLE, await controller.getAddress());

//         return { coreLoan, admin, user2, controller, testERC721 };
//     };

//     const checkTerms = (chain: LoanTerms, local: LoanTerms) => {
//         expect(chain.duration).to.equal(local.duration);
//         expect(chain.collateralId).to.equal(local.collateralId);
//         expect(chain.loanAmount).to.equal(local.loanAmount);
//         expect(chain.collateralAddress).to.equal(local.collateralAddress);
//         expect(chain.interestRate).to.equal(local.interestRate);
//     };

//     const createLoan = async (coreLoan: any, user: Signer, loanTerms: any) => {
//         const tx = await coreLoan
//             .connect(user)
//             .createLoan(loanTerms, await user.getAddress());
//         const receipt = await tx.wait();
//         if (receipt.events[0].args) {
//             return receipt.events[0].args.loanId;
//         } else {
//             console.log("Failed to Create a loan");
//         }
//     };

//     const requestLoan = async () => {
//         const { coreLoan, admin, testERC721 } = await loadFixture(fixture);
//         const collateralId = await mintERC721(testERC721, admin);
//         const loanTerms = generateLoanTerms({ collateralId });
//         const loanId = await createLoan(coreLoan, admin, loanTerms);
//         return { loanId, loanTerms, collateralId };
//     };

//     describe("Create Loan function", () => {
//         it("Should deploy the contract", async () => {
//             const { coreLoan } = await loadFixture(fixture);
//             const counter = await coreLoan.counter();
//             // eslint-disable-next-line no-unused-expressions
//             expect(counter.gte(zero)).to.be.true;
//         });

//         it("Should create a loan Request", async () => {
//             const { coreLoan, admin, testERC721 } = await loadFixture(fixture);
//             const collateralId = await mintERC721(testERC721, admin);
//             const loanTerms = generateLoanTerms({ collateralId });
//             const loanId = await createLoan(coreLoan, admin, loanTerms);

//             const loanDataOnChain = await coreLoan.getLoan(loanId);
//             // state
//             expect(loanDataOnChain.state).to.equal(0);
//             // borrower id
//             expect(loanDataOnChain.borrowerId).to.equal(
//                 await admin.getAddress()
//             );
//             // lender id
//             expect(loanDataOnChain.lenderId).to.equal(BigNumber.from(0));
//             // terms
//             checkTerms(loanDataOnChain.terms, loanTerms);
//         });

//         it("Should emit de CreateLoan event", async () => {
//             const { coreLoan, admin } = await loadFixture(fixture);
//             const loanTerms = generateLoanTerms({});
//             await expect(
//                 coreLoan
//                     .connect(admin)
//                     .createLoan(loanTerms, await admin.getAddress())
//             ).to.emit(coreLoan, "CreateLoan");
//         });

//         it("Should reject user without CONTROLLER_ROLE role", async () => {
//             const { coreLoan, user2 } = await loadFixture(fixture);
//             const loanTerms = generateLoanTerms({});
//             await expect(
//                 createLoan(coreLoan, user2, loanTerms)
//             ).to.be.revertedWith(
//                 `AccessControl: account ${(
//                     await user2.getAddress()
//                 ).toLowerCase()} is missing role ${CONTROLLER_ROLE}`
//             );
//         });
//     });

//     describe("Cancel Loan function", () => {
//         it("Should cancel a loan", async () => {
//             const { coreLoan, admin, testERC721 } = await loadFixture(fixture);
//             const collateralId = await mintERC721(testERC721, admin);
//             const loanTerms = generateLoanTerms({ collateralId });
//             const loanId = await createLoan(coreLoan, admin, loanTerms);

//             const loanDataOnChain = await coreLoan.getLoan(loanId);
//             // state first
//             expect(loanDataOnChain.state).to.equal(0);

//             // cancel loan
//             await coreLoan
//                 .connect(admin)
//                 .cancelLoan(loanId, await admin.getAddress());
//             const loanDataOnChain2 = await coreLoan.getLoan(loanId);
//             expect(loanDataOnChain2.state).to.equal(4);
//             const usedCollateral = await coreLoan
//                 .connect(admin)
//                 .usedCollateral(collateralId);
//             expect(usedCollateral).to.equal(false);
//         });

//         it("Should emit de CancelLoan event", async () => {
//             const { coreLoan, admin, testERC721 } = await loadFixture(fixture);
//             const collateralId = await mintERC721(testERC721, admin);
//             const loanTerms = generateLoanTerms({ collateralId });
//             const loanId = await createLoan(coreLoan, admin, loanTerms);

//             await expect(
//                 coreLoan
//                     .connect(admin)
//                     .cancelLoan(loanId, await admin.getAddress())
//             ).to.emit(coreLoan, "CancelLoan");
//         });
//     });

//     describe("Accept loan function", () => {
//         it("should accept a loan", async () => {
//             const { coreLoan, admin, controller, testERC721 } =
//                 await loadFixture(fixture);
//             const collateralId = await mintERC721(testERC721, admin);
//             const loanTerms = generateLoanTerms({ collateralId });
//             const loanId = await createLoan(coreLoan, admin, loanTerms);

//             await coreLoan
//                 .connect(controller)
//                 .acceptLoan(await controller.getAddress(), loanId);

//             const loanDataOnChain = await coreLoan.getLoan(loanId);
//             expect(loanDataOnChain.state).to.equal(1);
//             expect(loanDataOnChain.lenderId).to.equal(
//                 await controller.getAddress()
//             );
//         });
//         it("should revert a loanAcceptence without correct Accescontrol", async () => {
//             const { coreLoan, admin, user2, testERC721 } = await loadFixture(
//                 fixture
//             );
//             const collateralId = await mintERC721(testERC721, admin);
//             const loanTerms = generateLoanTerms({ collateralId });
//             const loanId = await createLoan(coreLoan, admin, loanTerms);

//             await expect(
//                 coreLoan
//                     .connect(user2)
//                     .acceptLoan(await user2.getAddress(), loanId)
//             ).to.be.revertedWith(
//                 `AccessControl: account ${(
//                     await user2.getAddress()
//                 ).toLowerCase()} is missing role ${CONTROLLER_ROLE}`
//             );
//         });

//         it("Should fail to accept a loan that is in a differend state than Request", async () => {
//             const { coreLoan, admin, controller, testERC721 } =
//                 await loadFixture(fixture);
//             const collateralId = await mintERC721(testERC721, admin);
//             const loanTerms = generateLoanTerms({ collateralId });
//             const loanId = await createLoan(coreLoan, admin, loanTerms);

//             await coreLoan
//                 .connect(controller)
//                 .acceptLoan(await controller.getAddress(), loanId);

//             await expect(
//                 coreLoan
//                     .connect(controller)
//                     .acceptLoan(await controller.getAddress(), loanId)
//             ).to.be.revertedWith("CoreLoan:: function acceptLoan, Wrong state");
//         });

//         it("Should emit de AcceptLoan event", async () => {
//             const { coreLoan, admin, controller, testERC721 } =
//                 await loadFixture(fixture);
//             const collateralId = await mintERC721(testERC721, admin);
//             const loanTerms = generateLoanTerms({ collateralId });
//             const loanId = await createLoan(coreLoan, admin, loanTerms);

//             await expect(
//                 coreLoan
//                     .connect(controller)
//                     .acceptLoan(await controller.getAddress(), loanId)
//             ).to.emit(coreLoan, "AcceptLoan");
//         });
//     });

//     describe("Repay loan function", () => {
//         it("Should repay a loan", async () => {
//             // load fixtures
//             const { coreLoan, admin, controller, testERC721 } =
//                 await loadFixture(fixture);
//             // create loan
//             const collateralId = await mintERC721(testERC721, admin);
//             const loanTerms = generateLoanTerms({ collateralId });
//             const loanId = await createLoan(coreLoan, admin, loanTerms);

//             // accept loan
//             await coreLoan
//                 .connect(controller)
//                 .acceptLoan(await controller.getAddress(), loanId);

//             // repay loan
//             await coreLoan.connect(admin).repayLoan(loanId);

//             const loanDataOnChain = await coreLoan.getLoan(loanId);
//             expect(loanDataOnChain.state).to.equal(2);
//             const usedCollateral = await coreLoan
//                 .connect(admin)
//                 .usedCollateral(collateralId);
//             expect(usedCollateral).to.equal(false);
//         });
//         it("Should emit de AcceptLoan event", async () => {
//             // load fixtures
//             const { coreLoan, admin, controller, testERC721 } =
//                 await loadFixture(fixture);
//             // create loan
//             const collateralId = await mintERC721(testERC721, admin);
//             const loanTerms = generateLoanTerms({ collateralId });
//             const loanId = await createLoan(coreLoan, admin, loanTerms);

//             // accept loan
//             await coreLoan
//                 .connect(controller)
//                 .acceptLoan(await controller.getAddress(), loanId);

//             // repay loan

//             await expect(coreLoan.connect(admin).repayLoan(loanId)).to.emit(
//                 coreLoan,
//                 "RepayLoan"
//             );
//         });
//     });
// });
