import { ethers } from "hardhat";
import chai from "chai";
import { Babel__factory, Babel } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

const { expect } = chai;

let babel: Babel;
let babelFactory: Babel__factory;
let deployer: SignerWithAddress;
let other: SignerWithAddress;

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

describe("babel", () => {

    beforeEach(async () => {
        [deployer, other] = await ethers.getSigners();
        babelFactory = (await ethers.getContractFactory(
            'Babel',
            deployer
        )) as Babel__factory;

        babel = (await babelFactory.deploy()) as Babel;
        expect(babel.address).to.properAddress;
    });

    describe("deployment", async () => {
        it("has expected name and symbol", async function () {
            expect(await babel.name()).to.equal("Babel");
            expect(await babel.symbol()).to.equal("LIB");
        });
    });

    describe("minting", async () => {
        const tokenId = ethers.BigNumber.from(1);
        const tokenURI = "https://kernel.community/images/shares/giving.png";
        
        it("should mint a new book when anyone calls it", async function () {
            await expect(babel.connect(deployer).mintBook(other.address, tokenURI))
               .to.emit(babel, 'Transfer')
               .withArgs(ZERO_ADDRESS, other.address, tokenId);
        })
    })

});