import { expect } from "chai";
import { Signer, BigNumber } from "ethers";
import { TestERC721 } from "../../typechain/TestERC721";

export const mintERC721 = async (
    token: TestERC721,
    to: Signer
): Promise<BigNumber> => {
    const tx = await token.safeMint(await to.getAddress());
    const receipt = await tx.wait();

    if (receipt.events && receipt.events[0].args) {
        return receipt.events[0].args.tokenId;
    } else throw new Error("Failed to mint test ERC721");
};
