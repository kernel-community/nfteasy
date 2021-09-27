# NFTeasy

Welcome to NFTeasy: a KERNEL build guild, created in a tree-like structure, that will walk you through how to create your own NFT smart contracts on Ethereum. This will not immediately make you into a shadowy super coder, but it will give you the basic skills and knowledge to understand, analyse and navigate the less fungible and supposedly more permanent parts of web3.

The beginning of each build guild session can be found on each numbered branch in this repo. Where we get to in each session is where the next branch begins. So, if you have trouble following along in real life, don't stress! The code we build together is available and waiting for you on the next branch.

Though we're going to begin in a very general way, we will have to make some opinionated choices as we dive deeper and get closer to a production-ready set of contracts. Please do not think that this is the only - or even the best! - way to write non-fungible token contracts. It is only one way of many, presented for educational purposes, not as a definitive stand about how NFTs should look.

## Lesson 0 - Long Life Libraries

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

## Conclusion

This work has laid the foundation for really understanding the full life cycle of developing a smart contract, whether it is an NFT or any other contract you feel inspired to write. We are very intentionally moving slowly and looking carefully at each of the tools we choose to pick up and use, because that is a critical part of the culture for which Kernel advocates.

> I don't know exactly what a prayer is.  
I do know how to pay attention, how to fall down  
into the grass, how to kneel down in the grass,  
how to be idle and blessed, how to stroll through the fields,  
which is what I have been doing all day.  
Tell me, what else should I have done?  