// import { expect } from "chai";
// import hre, { ethers, waffle } from "hardhat";
// import { mintERC721 } from "./util/testERC721";
// import { LoanTerms, generateLoanTerms } from "./util/types";

// const { loadFixture } = waffle;

// const checkTerms = (chain: LoanTerms, local: LoanTerms) => {
//     expect(chain.duration).to.equal(local.duration);
//     expect(chain.collateralId).to.equal(local.collateralId);
//     expect(chain.loanAmount).to.equal(local.loanAmount);
//     expect(chain.collateralAddress).to.equal(local.collateralAddress);
//     expect(chain.interestRate).to.equal(local.interestRate);
// };

// describe("Loan.sol Contract", () => {
//     const fixture = async () => {
//         const signers = await hre.ethers.getSigners();
//         const owner = signers[0];
//         const user1 = signers[1];
//         const user2 = signers[2];
//         const user3 = signers[3];

//         const loanFactory = await ethers.getContractFactory("Loan");
//         const Loan = await loanFactory.deploy();
//         await Loan.deployed();

//         const testERC721ContractFactory = await ethers.getContractFactory(
//             "TestERC721"
//         );
//         const testERC721 = await testERC721ContractFactory.deploy();
//         await testERC721.deployed();

//         return { owner, user1, user2, user3, testERC721, Loan };
//     };

//     describe("Setup", () => {
//         it("Should deploy the contract", async () => {
//             const { Loan } = await loadFixture(fixture);
//             expect(await Loan.counter()).to.equal(0);
//         });
//     });

//     describe("Function CreateLoan", () => {
//         it("Should create a loan Request", async () => {
//             const { Loan, user1, testERC721 } = await loadFixture(fixture);
//             const collateralId = await mintERC721(testERC721, user1);
//             const loanTerms = generateLoanTerms({ collateralId });

//             const approve = await testERC721
//                 .connect(user1)
//                 .approve(Loan.address, collateralId);

//             const tx = await Loan.connect(user1).createLoan(loanTerms);
//             // const receipt = await tx.wait();
//         });

//         it("Should emit de CreateLoan event", async () => {
//             const { Loan, user1, testERC721 } = await loadFixture(fixture);
//             const collateralId = await mintERC721(testERC721, user1);
//             const loanTerms = generateLoanTerms({ collateralId });

//             const approve = await testERC721
//                 .connect(user1)
//                 .approve(Loan.address, collateralId);

//             expect(await Loan.connect(user1).createLoan(loanTerms)).to.emit(
//                 Loan,
//                 "CreateLoan"
//             );
//         });

//         it("Should fail to initialize a loan if not approved", async () => {
//             const { Loan, user1, testERC721 } = await loadFixture(fixture);
//             const collateralId = await mintERC721(testERC721, user1);
//             const loanTerms = generateLoanTerms({ collateralId });

//             await expect(
//                 Loan.connect(user1).createLoan(loanTerms)
//             ).to.be.revertedWith(
//                 "ERC721: transfer caller is not owner nor approved"
//             );
//             expect(await testERC721.ownerOf(collateralId)).to.equal(
//                 await user1.getAddress()
//             );
//         });
//     });

//     describe("Function cancelLoan", () => {
//         it("Should cancel a loan", async () => {
//             // First, create a loan request
//             const { Loan, testERC721, user1 } = await loadFixture(fixture);
//             const collateralId = await mintERC721(testERC721, user1);
//             // const { loanId } = await requestLoan(collateralId, collateralId);
//             expect(await testERC721.ownerOf(collateralId)).to.equal(
//                 Loan.address
//             );

//             // cancel loan request
//             // await Loan.connect(user1).cancelLoan(loanId);
//             // const loan = await Loan.getLoan(loanId);
//             // expect(loan.state).to.equal(4);
//             // expect(await testERC721.ownerOf(collateralId)).to.equal(
//             //     await user1.getAddress()
//             // );
//         });
//     });
// });

// // expect(loanId).to.equal(BigNumber.from(1));

// // const loanDataOnChain = await Loan.getLoan(loanId);
// // // state
// // expect(loanDataOnChain.state).to.equal(0);
// // // borrower id
// // expect(loanDataOnChain.borrowerId).to.equal(
// //     await user1.getAddress()
// // );
// // // lender id
// // expect(loanDataOnChain.lenderId).to.equal(BigNumber.from(0));
// // // terms
// // checkTerms(loanDataOnChain.terms, loanTerms);

// // // collateral transfer
// // expect(await testERC721.ownerOf(collateralId)).to.equal(
// //     Loan.address
// // );

// // const requestLoan = async (collateralId: BigNumber, loanTerms: LoanTerms) => {
// //     const { Loan, user1, testERC721 } = await loadFixture(fixture);
// //     const approve = await testERC721
// //         .connect(user1)
// //         .approve(Loan.address, collateralId);

// //     const tx = await Loan.connect(user1).createLoan(loanTerms);
// //     const receipt = await tx.wait();

// //     // if (receipt && receipt.events && receipt.events)
// //     //     for (const event of receipt.events) {
// //     //         if (event.args) {
// //     //             const loanId = event.args.loanId;
// //     //             const loanAmount = event.args[0].loanAmount as BigNumber;
// //     //             return { loanId, loanAmount };
// //     //         }
// //     //     }
// //     if (
// //         receipt &&
// //         receipt.events &&
// //         receipt.events.length === 1 &&
// //         receipt.events[0].args
// //     ) {
// //         return receipt.events[0].args.loanId;
// //     } else {
// //         throw new Error("Unable to initialize loan");
// //     }
// // };
