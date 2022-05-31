// import { expect } from "chai";
// import { BigNumber, Signer } from "ethers";
// import hre, { ethers, waffle } from "hardhat";
// import { mintERC721 } from "./util/testERC721";
// import { LoanTerms, generateLoanTerms } from "./util/types";
// import { add } from "mathjs";

// const { loadFixture } = waffle;

// const CONTROLLER_ROLE =
//     "0x7b765e0e932d348852a6f810bfa1ab891e259123f02db8cdcde614c570223357";

// describe("Controller ", async () => {
//     const fixture = async () => {
//         const signers = await hre.ethers.getSigners();
//         const owner = signers[0];
//         const user1 = signers[1];
//         const user2 = signers[2];
//         const user3 = signers[3];

//         const coreLoanFactory = await ethers.getContractFactory("CoreLoan");
//         const coreLoan = await coreLoanFactory.deploy();
//         await coreLoan.deployed();

//         const controllerFactory = await ethers.getContractFactory("Controller");
//         const controller = await controllerFactory.deploy(coreLoan.address);
//         await controller.deployed();
//         const controllerPermision = await coreLoan.grantRole(
//             CONTROLLER_ROLE,
//             controller.address
//         );
//         await controllerPermision.wait();

//         const testERC721ContractFactory = await ethers.getContractFactory(
//             "TestERC721"
//         );
//         const testERC721 = await testERC721ContractFactory.deploy();
//         await testERC721.deployed();

//         return { owner, user1, user2, user3, controller, coreLoan, testERC721 };
//     };
//     it("Should deploy the contract", async () => {
//         const { controller, coreLoan } = await loadFixture(fixture);
//         expect(await controller.coreLoan()).to.equal(coreLoan.address);
//     });

//     // function for a loan request
//     const loanRequest = async () => {
//         const { controller, user1, testERC721 } = await loadFixture(fixture);
//         const collateralId = await mintERC721(testERC721, user1);
//         const loanTerms = generateLoanTerms({ collateralId });

//         // aprove controller to transfer the nft
//         const approve = await testERC721
//             .connect(user1)
//             .approve(controller.address, collateralId);

//         const tx = await controller
//             .connect(user1)
//             .initializeLoan(
//                 loanTerms,
//                 await user1.getAddress(),
//                 testERC721.address
//             );
//         const receipt = await tx.wait();
//         let loanId;
//         let loanAmount = hre.ethers.utils.parseEther("100");

//         if (receipt && receipt.events && receipt.events)
//             for (const event of receipt.events) {
//                 if (event.args) {
//                     loanId = event.args.loanId;
//                     loanAmount = event.args[0].loanAmount as BigNumber;
//                 }
//             }

//         return { loanId, user1, loanAmount, collateralId };
//     };

//     describe("function initializeLoan", async () => {
//         it("Should initialize a loan request", async () => {
//             const { controller, testERC721 } = await loadFixture(fixture);
//             const { loanId, collateralId } = await loanRequest();

//             expect(await testERC721.ownerOf(collateralId)).to.equal(
//                 controller.address
//             );
//             expect(loanId).to.equal(BigNumber.from(1));
//         });
//         it("Should fail to initialize a loan if not approved", async () => {
//             const { controller, user1, testERC721 } = await loadFixture(
//                 fixture
//             );
//             const collateralId = await mintERC721(testERC721, user1);
//             const loanTerms = generateLoanTerms({ collateralId });

//             await expect(
//                 controller
//                     .connect(user1)
//                     .initializeLoan(
//                         loanTerms,
//                         await user1.getAddress(),
//                         testERC721.address
//                     )
//             ).to.be.revertedWith(
//                 "ERC721: transfer caller is not owner nor approved"
//             );
//             expect(await testERC721.ownerOf(collateralId)).to.equal(
//                 await user1.getAddress()
//             );
//         });
//     });

//     describe("function prematureCancelLoan", () => {
//         it("Should cancel a loan", async () => {
//             const { controller, user1, coreLoan, testERC721 } =
//                 await loadFixture(fixture);
//             const { loanId, collateralId } = await loanRequest();
//             expect(await testERC721.ownerOf(collateralId)).to.equal(
//                 controller.address
//             );

//             // cancel loan
//             await controller.connect(user1).prematureCancelLoan(loanId);
//             const loan = await coreLoan.getLoan(loanId);
//             expect(loan.state).to.equal(4);
//             expect(await testERC721.ownerOf(collateralId)).to.equal(
//                 await user1.getAddress()
//             );
//         });
//         it("Should emit de PrematureCancelLoan event", async () => {
//             const { controller, user1 } = await loadFixture(fixture);
//             const { loanId } = await loanRequest();

//             expect(
//                 await controller.connect(user1).prematureCancelLoan(loanId)
//             ).to.emit(controller, "PrematureCancelLoan");
//         });

//         it("Should fail to cancel a loan that is not yours", async () => {
//             const { controller, user2 } = await loadFixture(fixture);
//             const { loanId } = await loanRequest();
//             await expect(
//                 controller.connect(user2).prematureCancelLoan(loanId)
//             ).to.revertedWith(
//                 "Controller:: prematureCancelLoan, only cancel your own loan"
//             );
//         });
//     });

//     describe("acceptLoan function", () => {
//         it("Should accept a loan", async () => {
//             const { controller, user1, user2, coreLoan } = await loadFixture(
//                 fixture
//             );
//             const { loanId, loanAmount } = await loanRequest();

//             await controller.connect(user2).acceptLoan(loanId, {
//                 value: loanAmount,
//             });
//             const loan = await coreLoan.getLoan(loanId);
//             expect(loan.state).to.equal(1);
//             expect(loan.lenderId).to.equal(await user2.getAddress());
//             expect(loan.borrowerId).to.equal(await user1.getAddress());
//         });

//         it("Should transfer the correct amount of Eth", async () => {
//             const { controller, user2, user1 } = await loadFixture(fixture);
//             const { loanId, loanAmount } = await loanRequest();
//             const balanceBefore = await user1.getBalance();

//             await controller.connect(user2).acceptLoan(loanId, {
//                 value: loanAmount,
//             });
//             const balanceAfter = await user1.getBalance();

//             expect(balanceAfter).to.be.above(balanceBefore);
//         });

//         it("Should fail if loan is in the wrong state", async () => {
//             const { controller, user2, user3 } = await loadFixture(fixture);
//             const { loanId, loanAmount } = await loanRequest();

//             await controller.connect(user2).acceptLoan(loanId, {
//                 value: loanAmount,
//             });

//             await expect(
//                 controller.connect(user3).acceptLoan(loanId, {
//                     value: loanAmount,
//                 })
//             ).to.be.revertedWith(
//                 "Controller:: acceptLoan, loan is not in Request state"
//             );
//         });

//         it("Should emit the AcceptLoan event", async () => {
//             const { controller, user2 } = await loadFixture(fixture);
//             const { loanId, loanAmount } = await loanRequest();

//             expect(
//                 await controller.connect(user2).acceptLoan(loanId, {
//                     value: loanAmount,
//                 })
//             ).to.emit(controller, "AcceptLoan");
//         });

//         it("Should fail if msg.value is not the same as loanAmount", async () => {
//             const { controller, user3 } = await loadFixture(fixture);
//             const { loanId } = await loanRequest();

//             await expect(
//                 controller.connect(user3).acceptLoan(loanId, {
//                     value: hre.ethers.utils.parseEther("1000"),
//                 })
//             ).to.be.revertedWith(
//                 "Controller:: acceptLoan, msg.value not same as loanAmount"
//             );
//             await expect(
//                 controller.connect(user3).acceptLoan(loanId, {
//                     value: hre.ethers.utils.parseEther("10"),
//                 })
//             ).to.be.revertedWith(
//                 "Controller:: acceptLoan, msg.value not same as loanAmount"
//             );
//         });
//     });
// });
