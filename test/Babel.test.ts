import { ethers } from "hardhat";
import chai from "chai";
import { Babel__factory, Babel } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

const { expect } = chai;

let babel: Babel;
let babelFactory: Babel__factory;
let deployer: SignerWithAddress;
let other: SignerWithAddress;

const PROXY_REGISTRATION_ADDRESS = "0xf57b2c51ded3a29e6891aba85459d600256cf317";
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

describe("babel", () => {

    beforeEach(async () => {
        [deployer, other] = await ethers.getSigners();
        babelFactory = (await ethers.getContractFactory(
            'Babel',
            deployer
        )) as Babel__factory;

        babel = (await babelFactory.deploy(PROXY_REGISTRATION_ADDRESS)) as Babel;
        expect(babel.address).to.properAddress;
    });

    describe("deployment", async () => {
        it("has expected name and symbol", async function () {
            expect(await babel.name()).to.equal("Babel");
            expect(await babel.symbol()).to.equal("LIB");
        });
    });

    describe("minting", async () => {
        const tokenId = ethers.BigNumber.from(0);
        const tokenURI = "https://kernel.community/images/shares/giving.png";
        
        it("should mint a new book when anyone calls it", async function () {
            await expect(babel.connect(deployer).safeMint(other.address, tokenURI))
               .to.emit(babel, 'Transfer')
               .withArgs(ZERO_ADDRESS, other.address, tokenId);
 
           await expect(babel.connect(deployer).setTokenURI(tokenId, tokenURI));
 
           await expect(babel.connect(other).setTokenURI(tokenId, tokenURI))
               .to.be.revertedWith('Ownable: caller is not the owner');
 
           expect(await babel.balanceOf(other.address)).to.equal(1);
           expect(await babel.ownerOf(tokenId)).to.equal(other.address);
           expect(await babel.tokenURI(tokenId)).to.equal(tokenURI);
       });
 
       it('other accounts cannot mint tokens', async () => {
           const tokenURI = "https://kernel.community/images/shares/giving.png";
           await expect(babel.connect(other).safeMint(other.address, tokenURI))
               .to.be.revertedWith('Ownable: caller is not the owner');
       });
   });

   describe("updating", async () => {
        it('update tokenURI works as expected', async() => {
            const tokenId = ethers.BigNumber.from(0);
            const tokenURI = "https://kernel.community/images/shares/giving.png";
            const newTokenURI = "https://kernel.community/images/shares/learning.png";

            await expect(babel.connect(deployer).safeMint(other.address, tokenURI))
                .to.emit(babel, 'Transfer')
                .withArgs(ZERO_ADDRESS, other.address, tokenId);
            
            await expect(babel.connect(other).updateTokenURI(tokenId, newTokenURI))
                .to.emit(babel, 'TokenURIUpdated')
                .withArgs(tokenId, newTokenURI);

            await expect(babel.connect(deployer).updateTokenURI(tokenId, newTokenURI))
                .to.be.revertedWith('ERC721Tradable: caller is not the owner of this token');
        });
    });
 
   describe("batch minting", async () => {
       it('contract owner can batch mint tokens', async () => {
           const tokenId = ethers.BigNumber.from(0);
           const tokenId2 = ethers.BigNumber.from(1);
           const tokenURI = "https://kernel.community/images/shares/giving.png";
           const tokenURI2 = "https://kernel.community/images/shares/learning.png";
 
           await expect(babel.connect(deployer).safeBatchMint(other.address, [tokenURI, tokenURI2]))
               .to.emit(babel, 'Transfer')
               .withArgs(ZERO_ADDRESS, other.address, tokenId)
               .to.emit(babel, 'Transfer')
               .withArgs(ZERO_ADDRESS, other.address, tokenId2);
       });
   });
          
 
   describe("burning", async () => {
       it('holders can burn their tokens', async () => {
           const tokenId = ethers.BigNumber.from(0);
           const tokenURI = "https://kernel.community/images/shares/giving.png";
 
           await expect(babel.connect(deployer).safeMint(other.address, tokenURI))
               .to.emit(babel, 'Transfer')
               .withArgs(ZERO_ADDRESS, other.address, tokenId);
 
           await expect(babel.connect(other).burn(tokenId))
               .to.emit(babel, 'Transfer')
               .withArgs(other.address, ZERO_ADDRESS, tokenId);
           expect(await babel.balanceOf(other.address)).to.equal(0);
           await expect(babel.ownerOf(tokenId))
               .to.be.revertedWith('ERC721: owner query for nonexistent token');
           expect(await babel.totalSupply()).to.equal(0);
       });
 
       it('cannot burn if not token owner', async () => {
           const tokenId = ethers.BigNumber.from(0);
           const tokenURI = "https://kernel.community/images/shares/giving.png";
 
           await expect(babel.connect(deployer).safeMint(other.address, tokenURI))
               .to.emit(babel, 'Transfer')
               .withArgs(ZERO_ADDRESS, other.address, tokenId);
 
           await expect(babel.connect(deployer).burn(tokenId))
               .to.be.revertedWith('function call to a non-contract account');
 
           expect(await babel.balanceOf(other.address)).to.equal(1);
           expect(await babel.totalSupply()).to.equal(1);
       });
   });    

});