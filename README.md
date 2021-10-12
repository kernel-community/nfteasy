# NFTeasy

We've looked into the nature of Git, Node and Hardhat and have been courageous enough to dive into the infamous `node_modules` directory to understand more about the Open Zeppelin libraries and all they enable us to do in a safe and peer-reviewed manner. We've even written our first smart contract.

Now it's time to speak of compilers, networks, types, tests, and tasks. It's important to note that you do not need to go down this exact route when writing your own contracts: this tutorial is more of a character test than anything else. As we said last time, the closer we get to production-level development, the more opinionated our approach necessarily becomes. We're going to use typescript for the rest of this guild because it provides some neat safety guarantees, but this comes at a cost. 

Good engineering is about the conscious, clear and precise [management](https://kernel.community/en/learn/module-0/play-of-pattern) of [trade-offs](https://kernel.community/en/learn/module-4/consensus/#brief). More than any specific skill, we wish to illustrate how we think about different trade-offs in the course of this guild session.

## Lesson 1 - Character Types

Compiling and deploying contracts safely is something that is worth taking some time to learn. We're going to do it with typescript, which offers us some great safety guarantees that are, probably, worth the extra effort.

We'll begin today by installing a whole new range of `devDependencies` and discussing what happens in your terminal when you issue these new commands. Suffice it to say at this point that the trade-offs we are making will become _immediately_ apparent. 

One other, bonus feature to consider is the language of the terminal. Werner Herzog was obsessed with the [language of cattle auctioneers](https://www.youtube.com/watch?v=k1W5wAGzCpU&t=754s), and we'll maybe take a few minutes to assess that same idea in the [context of computer science](https://twitter.com/cryptowanderer/status/1134017760466481153).

1. Install all the necessary dev dependencies by running the following in your terminal:

```bash
npm i --save-dev @nomiclabs/hardhat-waffle ethereum-waffle chai @nomiclabs/hardhat-ethers ethers
npm i --save-dev ts-node typescript typechain ts-generator
npm i --save-dev @types/node @types/mocha @types/chai @typechain/ethers-v5 @typechain/hardhat
```

2. Create a file called `hardhat.config.ts`.

3. Add the following configuration code to it. We'll explain each line in the live session.

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

## Compile & Deploy

4. Now that we've done all the necessary setup, you can compile Babel!

```bash
npx hardhat compile
```

You should see three new directories pop up: `artifacts`, `cache`, and `typechain`. Each of these contains useful information for developers, which we'll also briefly look at in our live session.

5. The last thing we need to do is write a deploy `task`. So, create a `tasks` directory with three things in it: `task-names.ts`, `accounts.ts` and another directory called `deployment`, with a `deploy.ts` file in it. 

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

6. Add these last two lines below the other `imports` in `hardhat.config.ts` to complete it all:

```ts
import "./tasks/accounts";
import "./tasks/deployment/deploy";
```

7. Now, you can run a local chain and deploy your contract:

```bash
npx hardhat node
```

and, in a new terminal:

```bash
npx hardhat deploy
```

## Testing

Right, so we've compiled and deployed Babel onto a local network: a simulation of an Ethereum chain running just on our own computer. Before we think about venturing out into the wider world of shared webs, we need to make sure that our contract actually does what it says on the box. In other words, we need to test it.

8. First, create a new `test` directory, with a file in it called `Babel.test.ts`.

9. Copy and paste this code into it. We'll discuss it in full in the live session:

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

});
```

10. Run `npx hardhat test` in your terminal and check that this simple test passes.

11. Add the following code to your `Babel.test.ts` file, below the block that describes our deployment tests, in order to begin testing the `mint` functionality.

```ts
describe("minting", async () => {
    const tokenId = ethers.BigNumber.from(1);
    const tokenURI = "https://kernel.community/images/shares/giving.png";
    
    it("should mint a new book when anyone calls it", async function () {
        await expect(babel.connect(deployer).mintBook(other.address, tokenURI))
            .to.emit(babel, 'Transfer')
            .withArgs(ZERO_ADDRESS, other.address, tokenId);
    })
})
```

There are obviously many more things we could test, and much better ways to write an NFT contract, which we will explore in the next guild session. For now, it's enough to understand how Chai works and how important it is to write tests for your contracts.

## Conclusion

Tutorials sometimes take the easy route, which we have not done here. I want to give you some insight into what writing contracts for production actually looks like. This is not just a toy example, by the time we're done with this build guild, I want you to have a repo that you understand and which you can genuinely use for your own creative work and dreams.