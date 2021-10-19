# NFTeasy

So, we've [built babel with our mirth](https://www.poetryfoundation.org/poems/54933/ode-) but libraries have this nasty habit of burning down, often because they provide access to knowledge that threatens those in assumed positions of authority. So, we’ll also be looking at the idea of permanence and the kinds of tools we have at our disposal to ensure that what we build with shared libraries has the durability of a pyramid or - even better - cycads and coelacanths.

Before we get there, though, we'll need to have something worth making permanent. Which means, being good developers, that we're going to have to improve our contract, think about where it will live and how it will interact with other contracts that share its space, and what sort of creative objects we wish to propagate with it. We'll also need to write more tests to make sure it does what we intend it to, and that others will not be able to abuse it for lack of care or attention on our part.

## Lesson 2 - Perma-Network Culture

Installing all those typescript `devDependencies` in our last session led us into a discussion about engineering trade-offs and the seeming imperfections of this world. Now we're going to take this a step further.

If you want your NFTs to be visible, you can just build your own site and host them where you like. This is my personal preference. Of course, it's not a very viable economic decision, because hosting a site costs money, and any marketing you might want to do also costs money, and all of these costs need to be offset somehow. Enter the marketplace.

There are many marketplaces for NFTs, each with their own advantages and drawbacks, so we'll just focus on the largest one for now: [Opensea](https://docs.opensea.io/docs/1-structuring-your-smart-contract#opensea-whitelisting-optional). We're going to improve our NFT contract and optimise it for user experience on Opensea. This entails quite a lengthy discussion about why and what the actual trade-offs are, so settle in and get comfortable.

### Improving Babel

Now that we're more familiar with how open Opensea really is, let's get to work improving our contract and preparing to deploy it on a real test network.

1. First, make sure you switch to this branch, which has some helper contracts pre-added, which we will explain in due course as we build our NFTs with an actual marketplace in mind. We'll likely need to clean things up after our previous adventures, so run these two lines in your terminal:

```bash
git checkout lesson-2
npx hardhat clean
```

2. Next, we're going to split up our Babel contract. Ideally, we want to keep all the logic associated with minting, trading and transfering our NFTs in one place, and just house the top-level information about Babel in the current contract. So, in your `contracts` directory, create a new file called `ERC721Tradable.sol` and add the code below to it. As always, we will explain this code in the live session:

```sol
// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./common/meta-transactions/ContentMixin.sol";
import "./common/meta-transactions/NativeMetaTransaction.sol";

contract OwnableDelegateProxy {}

contract ProxyRegistry {
    mapping(address => OwnableDelegateProxy) public proxies;
}

/**
 * @title ERC721Tradable
 * ERC721Tradable - ERC721 contract that whitelists a trading address, and has minting functionality.
 */
abstract contract ERC721Tradable is
    ContextMixin,
    ERC721Enumerable,
    NativeMetaTransaction,
    ERC721URIStorage,
    ERC721Burnable,
    Ownable
{
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    address proxyRegistryAddress;

    event TokenURIUpdated(uint256 indexed _id, string _value);

    constructor(
        string memory _name,
        string memory _symbol,
        address _proxyRegistryAddress
    ) ERC721(_name, _symbol) {
        proxyRegistryAddress = _proxyRegistryAddress;
        _initializeEIP712(_name);
    }  

    /**
     * @dev Safely mints a token to an address with a tokenURI.
     * @param to address of the future owner of the token
     * @param metadataURI full URI to token metadata
     */
    function safeMint(address to, string memory metadataURI)
        public onlyOwner
    {
        uint256 newTokenId = _tokenIdCounter.current();
        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, metadataURI);
        _tokenIdCounter.increment();
    }

    function safeBatchMint(address to, string[] memory metadataURIs)
        public onlyOwner
    {
        if (metadataURIs.length > 1) {
            for (uint256 i = 0; i < metadataURIs.length; i++) {
                safeMint(to, metadataURIs[i]);
            }
        }
    }

    function setTokenURI(uint256 tokenId, string memory _tokenURI)
        public
        onlyOwner
    {
        _setTokenURI(tokenId, _tokenURI);
    }

    function updateTokenURI(uint256 tokenId, string memory newTokenURI) 
        public 
    {
        address holder = ERC721.ownerOf(tokenId);
        require(
                _msgSender() == holder,
                "ERC721Tradable: caller is not the owner of this token"
            );
        _setTokenURI(tokenId, newTokenURI);
        emit TokenURIUpdated(tokenId, newTokenURI);
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * Override isApprovedForAll to whitelist user's OpenSea proxy accounts to enable gas-less listings.
     */
    function isApprovedForAll(address owner, address operator)
        public
        view
        override
        returns (bool)
    {
        // Whitelist OpenSea proxy contract for easy trading.
        ProxyRegistry proxyRegistry = ProxyRegistry(proxyRegistryAddress);
        if (address(proxyRegistry.proxies(owner)) == operator) {
            return true;
        }

        return super.isApprovedForAll(owner, operator);
    }

    /**
     * This is used instead of msg.sender as transactions won't be sent by the original token owner, but by OpenSea.
     */
    function _msgSender()
        internal
        view
        override
        returns (address sender)
    {
        return ContextMixin.msgSender();
    }
}
```

3. Next, we're going to need to adapt our `Babel.sol` contract to simply inherit from this new Tradable contract and reference only the critical top-level information used to distinguish it from other NFTs. Delete what is currently in that file and add this:

```sol
// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./ERC721Tradable.sol";

contract Babel is ERC721Tradable {
    constructor(
        address _proxyRegistryAddress
    ) ERC721Tradable('Babel', 'LIB', _proxyRegistryAddress) {}

    /**
     * @dev Link to Contract metadata https://docs.opensea.io/docs/contract-level-metadata
    */
    function contractURI() public pure returns (string memory) {
        return "https://arweave.net/<your_URL>";
    }
}
```

4. Perfect! Now, we need to update our tasks, and write some new tests for all of this functionality. We'll begin with the tasks. Instead of just declaring a `const network` in your `tasks/deployment/deploy.ts` file, replace it with the below:

```ts
    var PROXY_REGISTRATION_ADDRESS = '0xa5409ec958c83c3f309868babaca7c86dcb077c1';
    const network = await hre.ethers.provider.getNetwork();
    console.log(`network: ${network.name}`);
    
    if (network.name === "rinkeby") {
      console.log('using opensea proxy address for rinkeby');
      PROXY_REGISTRATION_ADDRESS = '0xf57b2c51ded3a29e6891aba85459d600256cf317';
    }
```

Seeing as our contract now expects the Proxy Address it references to be passed in as an argument when it is being deployed, let's change the actual deploy line to read:

```ts
const babel = await BabelFactory.deploy(PROXY_REGISTRATION_ADDRESS);
```

5. Because we cleaned things up at the beginning of this session, and have made all these structural changes, we'll need to recompile our contracts. In order to do so without errors, we'll need to tell our typescript modules not to try and transpile stuff just yet. Once we've got new compiled code, we can deploy it. Open a terminal and run:

```bash
TS_NODE_TRANSPILE_ONLY=1 npx hardhat compile
npx hardhat deploy
```

**Copy and store the deployed address somewhere safe, we'll need it later**.

6. If all goes according to plan, we can move onto writing some new tests. We'll provide here the whole testing file, but don't be intimidated: we'll be stepping carefully through each `describe` block in detail during the live session. Nor is this necessarily complete: it's just enough to ensure that the main functions do only what they are intended to and no more. Replace what is in `Babel.test.ts` with the following:

```ts
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
```

7. Now, we can run `npx hardhat test` in our terminal and check the output matches our expectations and descriptions of how our Babel NFT contract should behave.

8. We have also included for you another directory in `tasks` to begin helping with all the various operations you can consider writing against your new contract. We'll go over this in some detail during the live session.

### The Final Test

If your deploy task works and your tests are all passing, then it is time - finally! - to prepare yourself to deploy on an actual, shared network. We'll work on Rinkeby, seeing as that is where the Opensea Proxy Registration test contract is. In order to deploy there, we'll need to update our `hardhat.config.ts` file, and look inside the `assets` folder that magically appeared in your file directory when you checked out this branch at the beginning of the session.

8. First, let's add a few more `devDependencies`:

```bash
npm i --save-dev dotenv hardhat-gas-reporter @nomiclabs/hardhat-etherscan solidity-coverage
```

9. Then, we can update our `hardhat.config.ts` file to look like this:

```ts
import { config as dotEnvConfig } from "dotenv";
dotEnvConfig();
import { HardhatUserConfig } from "hardhat/types";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "@nomiclabs/hardhat-etherscan";
import "solidity-coverage";

import "./tasks/accounts";
import "./tasks/deployment/deploy";
import "./tasks/operations/mint-token";
import "./tasks/operations/batchmint-token";
import "./tasks/operations/burn-token";

const INFURA_API_KEY = process.env.INFURA_API_KEY || "";
const MAINNET_PRIVATE_KEY = process.env.MAINNET_PRIVATE_KEY || "";
const RINKEBY_PRIVATE_KEY = process.env.RINKEBY_PRIVATE_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

const config: HardhatUserConfig = {
    defaultNetwork: "hardhat",
    solidity: {
        compilers: [{ version: "0.8.6", settings: {
            optimizer: {
                enabled: true,
                runs: 200
          },
        } }],
    },
    networks: {
        hardhat: {
            initialBaseFeePerGas: 0,
        },
        localhost: {},
        coverage: {
            url: "http://127.0.0.1:8555", // Coverage launches its own ganache-cli client
        },
        rinkeby: {
            url: `https://rinkeby.infura.io/v3/${INFURA_API_KEY}`,
            accounts: [RINKEBY_PRIVATE_KEY],
        },
        mainnet: {
            url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
            accounts: [MAINNET_PRIVATE_KEY],
        },
    },
    gasReporter: {
        enabled: true,
        currency: "USD",
        gasPrice: 21,
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
};

export default config;
```

10. You'll need to rename `.env.sample` to `.env` and put in values for `INFURA_API_KEY` and  `ETHERSCAN_API_KEY`, as well as a private key (which you can get from Metamask). Make sure the RINKEBY_PRIVATE_KEY corresponds to an address that has some Rinkeby ETH in it. Fetch the locally deployed address you stored in Step 5 and paste it into LOCALHOST_CONTRACT_ADDRESS.

11. Let's do one last check locally that these tasks are working.

```bash
npx hardhat mint-token --metadata-uri ar://TaQoXaLI8TzBIooL3CGPQN2ZGuFNZkvff3y00tg7u7s
npx hardhat burn-token --token-id 0
```

12. Phew, we're finally ready to deploy to Rinkeby! (If you're just reading through this, rather than participating in the session with us, then make sure you use some permanent reference for the contract metadata in `Babel.sol` from Step 3 before proceeding. Alternatively, you can use `https://arweave.net/dI21K6IoG8k1kzVUNPswpSgyZ_NktEBqu2KUWbl9zMc`, which is where we've placed some example metadata.)

```bash
npx hardhat deploy --network rinkeby
```

13. Now, we can mint a token and see what it looks like on Opensea...

```bash
npx hardhat mint-token --network rinkeby --metadata-uri ar://TaQoXaLI8TzBIooL3CGPQN2ZGuFNZkvff3y00tg7u7s
```

14. Navigate to [Opensea's test domain](https://testnets.opensea.io/) and put the MINT_TO_ADDRESS into the search. The Babel NFT you just minted should show up under that address' assets.

## Conclusion

Thanks for staying with us all the way to the end. If you've made it this far, you'll likely be wanting to adapt the contracts and setup to your own use. If that is the case, you'll also likely need some Arweave tokens to store what data you need there. Please ping @cryptowanderer in slack and he will hook you up.

It's been an epic journey, and it won't stop here. However, if you step back from your machine for a while and look at things in perspective, you'll realise that you now have everything you need to start making your own custom NFTs.
