# NFTeasy

Welcome to NFTeasy: a KERNEL build guild, created in a tree-like structure, that will walk you through how to create your own NFT smart contracts on Ethereum. This will not immediately make you into a shadowy super coder, but it will give you the basic skills and knowledge to understand, analyse and navigate the less fungible and supposedly more permanent parts of web3.

The beginning of each build guild session can be found on each numbered branch in this repo. Where we get to in each session is where the next branch begins. So, if you have trouble following along in real life, don't stress! The code we build together is available and waiting for you on the next branch.

Though we're going to begin in a very general way, we will have to make some opinionated choices as we dive deeper and get closer to a production-ready set of contracts. Please do not think that this is the only - or even the best! - way to write non-fungible token contracts. It is only one way of many, presented for educational purposes, not as a definitive stand about how NFTs should look.

## Lesson 1 - Long Life Libraries

In this lesson, we're going to get a little more familiar with hardhat and use it to reflect on the OpenZeppelin ERC721 library and what it can do for us.

Any open source software project stands on the shoulders of giants, and this tutorial is primarily about getting familiar with what that really means in the context of Ethereum.

### Setup

1. Make sure you have installed [Git](https://git-scm.com/downloads), [Node](https://nodejs.org/dist/latest-v12.x/), [Yarn](https://classic.yarnpkg.com/en/docs/install/#mac-stable) and [Hardhat](https://hardhat.org/getting-started/#installation).

2. Clone this repo and change directory into it:

```bash
git clone https://github.com/kernel-community/nfteasy.git
cd nfteasy
```

3. Start your hardhat setup:

```bash
npx hardhat
npm install --save-dev "hardhat@^2.6.4"
```

4. Install the OpenZeppelin contract libraries:

```bash
npm install --save-dev @openzeppelin/contracts
```

### Read and Write (without) Permission

5. Take a look inside your new `node_modules` folder using a code editor of your choice (we recommended [VSCode](https://code.visualstudio.com/download) or [Atom](https://atom.io/) in the introductory lesson).

What a mess, right? Discussing node package management is another whole set of tutorials, so let's just focus in on the `@openzeppelin/contracts` directory for now, especially the `token/ERC721` subdirectory within it.

6. Even this sub-subdirectory is a lot to take in, we know. Don't stress though, you don't need to know what it all does yet. Just appreciate for a moment how easy it is to use the audited, secure, battle-tested work of amazing people, and the fact that you can do so freely.

7. We're going to write our own simple NFT contract now, using this library. Create a directory called `contracts` in the root of your repo. And, in that directory, create a file called `Babel.sol`.

8. Copy and paste the code below into your new `Babel.sol` contract. We'll discuss it in full in the live session.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract Babel is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    constructor() ERC721("Babel", "LIB") {}

    function mintBook(address reader, string memory tokenURI)
        public
        returns (uint256)
    {
        _tokenIds.increment();

        uint256 newBookId = _tokenIds.current();
        _mint(reader, newBookId);
        _setTokenURI(newBookId, tokenURI);

        return newBookId;
    }
}
```

## Compile and Deploy

This gets a whole new section, because compiling and deploying contracts safely is something that is worth taking some time to learn. We're going to do it with typescript, which offers us some great safety guarantees that are, in my opinion, worth the extra effort.

9. Install all the necessary dev dependencies by running the following in your terminal:

```bash
npm i --save-dev @nomiclabs/hardhat-waffle ethereum-waffle chai @nomiclabs/hardhat-ethers ethers
npm i --save-dev ts-node typescript typechain ts-generator
npm i --save-dev @types/node @types/mocha @types/chai @typechain/ethers-v5 @typechain/hardhat
```

10. Rename your `hardhat.config.js` file to `hardhat.config.ts`.

11. Add the following configuration code to it. We'll explain each line in the live session.

```ts
import { HardhatUserConfig } from "hardhat/types";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  solidity: {
      compilers: [{ version: "0.8.6", settings: {} }],
  },
  networks: {
      hardhat: {
          initialBaseFeePerGas: 0,
      },
      localhost: {},
  }
};

export default config;
```

12. Compile your brand new Babel contract!

```bash
npx hardhat compile
```

You should see three new directories pop up: `artifacts`, `cache`, and `typechain`. Each of these contains useful information for developers, which we'll also briefly look at in our live session.

13. The last thing we need to do is write a deploy `task`. So, create a `tasks` directory with three things in it: `task-names.ts`, `accounts.ts` and another directory called `deployment`, with a `deploy.ts` file in it. 

Paste the following code into `task-names.ts`:

```ts
export const TASK_ACCOUNTS: string = "accounts";
export const TASK_DEPLOY: string = "deploy";
```

Paste the following code into `accounts.ts`:

```ts
import { Signer } from "@ethersproject/abstract-signer";
import { task } from "hardhat/config";

import { TASK_ACCOUNTS } from "./task-names";

task(TASK_ACCOUNTS, "Prints the list of accounts", async (_taskArgs, hre) => {
  const accounts: Signer[] = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(await account.getAddress());
  }
});
```

And, finally, paste this into `deployment/deploy.ts`:

```ts
import { task } from "hardhat/config";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Babel__factory } from "../../typechain";
import { TASK_DEPLOY } from "../task-names";

task(TASK_DEPLOY, "Deploy contract")
  .setAction(async (args, hre) => {
    let deployer: SignerWithAddress;

    const network = await hre.ethers.provider.getNetwork();
    console.log(`network: ${network.name}`);
    

    [deployer] = await hre.ethers.getSigners();
    const address = await deployer.getAddress();
    console.log(`deployer address: ${address}`);

    const BabelFactory = (await hre.ethers.getContractFactory(
      'Babel',
      deployer
    )) as Babel__factory;

    console.log('Deploying Babel...');
    const babel = await BabelFactory.deploy();
    await babel.deployed();

    console.log('Babel deployed to:', babel.address);
  });
```

14. Add these last two lines below the other `imports` in `hardhat.config.ts` to complete it all:

```ts
import "./tasks/accounts";
import "./tasks/deployment/deploy";
```

15. Now, you can run a local chain and deploy your contract:

```bash
npx hardhat node
```

and, in a new terminal:

```bash
npx hardhat deploy --network hardhat
```

## Conclusion

I know that the Compile and Deploy section may seem complicated. However, it has laid the foundation for everything we need going forward and gives us a great base to work from across multiple networks with strongly-typed guarantees.

Tutorials sometimes take the easy route, which we have not done here. I want to give you some insight into what writing contracts for production actually looks like. This is not just a toy example, by the time we're done with this build guild, I want you to have a repo that you understand and which you can genuinely use for your own creative work and dreams.