# NFTeasy 

In this guild session, we'll be looking at a few different distribution strategies we can think about as purveyors of the world's most well-understood NFTs. We finished last week by deploying our Opensea-enabled NFT contract on Rinkeby and minting an NFT which had its metadata permanently stored on Arweave. We could call this the "simple minting" approach. The contract itself, and the tasks we've written, can also be used to do batch-minting, but this is essentially the same thing at a slightly larger scale. We mint NFTs from the "block hole" at the heart of the Ethereal Galaxy to an account we control, and then sell or distribute them via Opensea, with the help of native meta-transactions and a smooth UX. However, what if we wanted our users to mint the NFTs themselves?

# Lesson 3 - The Woods Are Lovely, Dark, and Deep

There are three general cases for this kind of buyer-mints-nft approach. The first is that anyone can buy and mint the NFTs you make and upload to some permanent store. We recommend following this [scaffold-eth example](https://github.com/scaffold-eth/scaffold-eth/tree/buyer-mints-nft) if that is what interests you. However, we want to discuss how to distribute NFTs in such a way that they can be used to create community and keep those great vibes frequent. In this case, we only want specific people to be able to mint NFTs. It's not scarcity we care about in this guild: it's _personalisation_.

The other two cases lie within this realm of personalised, communal NFT distribution mechanisms. Either you have all the addresses you need for your distribution (in which case you can use a merkle root in your contract), or you don't (in which case you can use some kind of linkdrop, which makes some security trade-offs, but also has some neat features). The Kernel Gratitude NFTs work with this third case, and allow us to update the merkle root in our contract whenever a new block is mined.

In this session, we'll be discussing how to handle both cases: loading predetermined ETH addresses into your contract as a merkle root, and signing minting authorizations off-chain with an updatable merkle root.

Welcome to the forest of thanks.

## Setup

1. Install dependencies

```
$ npm i
```

2. Clean and compile the contracts

```
$ TS_NODE_TRANSPILE_ONLY=1 npx hardhat clean
$ TS_NODE_TRANSPILE_ONLY=1 npx hardhat compile
```

3. Setup .env (refer .env.sample)
```
$ source .env
```

## Let's start with the case where we have a bunch of NFTs to distribute
The primary challenge here is that the minting is supposed to be limited to a certain set of people

## I have to distribute NFTs - but it shouldn't be claimable by everyone — only for a specific set of users

- Alice creates an NFT contract (which we already have)
- Alice mints 10 NFTs for 10 receivers, paying ~$50 for one mint (~$500) (which we already can)

## But I don't want to pre-mint the tokens — that's alot of gas!

1. Alice doesn't have $500 ☹️ but she has everyone's Ethereum addresses
2. She needs an efficient way for the smart contract to approve minting only for these set of addresses
3. She can give *something* to each user and let smart contract know of all these users & the users can use that *something* get their token 
4. Ideally, we wouldn't want that *something* to be generated on-chain, to reduce gas-fees
5. Alice can authorise these 10 addresses and give each of them a little unique secret that they can show up before they come up to "claim" their token

### Technical Implementation
- 2 ways for Alice to sign the authorisation, to generate the little secret:
    - With signatures
    [Data + private key = signature; data + signature = pub key]
        - 3 signature strategies:
            - Personal Sign
            - signTypedData
            - ERC1271, standard sig validation for contracts ([read more](https://eips.ethereum.org/EIPS/eip-1271)) *(not included in this lesson)*
    - With Merkle Trees

We'll cover ERC712 and Merkle Tree implementation in this lesson

### With Signature (ERC712)
 
In the contract
<details>
  <summary>
    we need a public function callable by anyone
  </summary>

  ```javascript
    function mintToken(address tokenId) external {
        _safeMint(msg.sender, tokenId);
    }
  ```

</details>
<details>
  <summary>
    but we don't want it to be called by everyone, so we need some require
  </summary>

  ```javascript
    function mintToken(address tokenId) external {
        require(...);
        _safeMint(msg.sender, tokenId);
    }
  ```

</details>

<details>
  <summary>
    we'll also include the "little something" into the mix, that will be used to verify an authorised user (receiver of the NFT)
  </summary>

  ```javascript
    function mintToken(address tokenId, bytes calldata signature, address account) external {
        require(...); // this is where we verify
        _safeMint(account, tokenId); // why did we change this? -- because we only want to mint to "verified" tokens, not msg.sender -- signature being the source of truth
    }
  ```

</details>

<details>
  <summary>
    we'll want the `require` to take in account and signature and verify if the account is a valid "minter"
  </summary>

  ```javascript
  function mintToken(address tokenId, bytes calldata signature, address account) external {
			require(_verify(_hash(account, tokenId), signature), "Invalid signature"); // this is where we verify
			_safeMint(account, tokenId); // why did we change this? -- because we only want to mint to "verified" tokens, not msg.sender -- signature being the source of truth
  }
  ```

  - `_hash` will produce a simple ECDSA sig of the 2 args
  - `_verify` will take a hash and a signature and will first recover address that signed the hash (using signature and hash) and then return true only if the recovered address has a minter role and will return false otherwise

</details>

- [Entire contract code](/contracts/BabelAuthMint.sol)

### With Merkle Trees

- Useful if we'd like to distribute to a large number of receivers
- We're really just looking for a special way of structuring mechanism for data that allows us efficient verification of an element's belongingness to a set without knowing all of the elements in the set  —— note: we're not "looking" for the element, we are only verifying if it exists in a set of n elements or not
- As a matter of fact, a data structure like this exists and is called a Merkle Tree.

<details>
  <summary>
    A Brief on Merkle Trees
  </summary>

  - A merkle tree, also known as a binary hash tree, is a data structure used for efficiently summarizing and verifying the integrity of large sets of data. Merkle trees are binary trees containing cryptographic hashes.
  - Binary = each node has ≤ 2 branches
  - Best used for summarizing and verification
  - Used in peer to peer networks such as Tor, Bitcoin (Blockchain networks), Git

</details>

So, in the contract

<details>
  <summary>If we make the contract aware of just the root</summary>

  ```javascript
    bytes32 immutable public root;
    function setMerkleRoot (bytes32 newRoot) public onlyOwner {
            root = newRoot;
    }
  ```

</details>

<details>
  <summary>
    And on each call to mint, we generate the leaf and check if it exists in the merkle tree rooted at root
  </summary>

  ```javascript
    function mintToken(address account, uint256 tokenId, bytes32[] calldata proof) external {
        require(_verify(_leaf(account, tokenId), proof), "Invalid merkle proof");
        _safeMint(account, tokenId);
    }
  ```

  - `_leaf` creates a leaf from the 2 args, that will be checked for existence is the tree
  - `_verify` Takes a leaf, proof and root — proof is the claim that leaf exists in the tree, the function returns true if the leaf is a part of the tree (claim is correct), and returns false otherwise
</details>

We'll be able to mint only for the (account, tokenId) pairs that exist in the merkle tree (or in Alice's community!)

## What if I don't have everyone's Ethereum addresses?
- If Alice just has email addresses, she can create a merkle tree using emails and either:
    - use a client authentication system (login with email), or
    - create unique claimable links for each recipient (linkdrop)
This brings us to:

## How exactly do recipients "Claim" their NFT?
- Alice now has a smart contract that has a public mint function which can be used by specific set of users to "claim" their NFT. She's paying a lot less gas than she'd have to if she were pre-minting all those NFTs and distributing them to her users
- But, all the users aren't technical enough to be able to generate their own signature or their own Merkle proof to claim their NFT. **How will Alice close the loop and make it seamless for users to be able to claim their NFT (if they are eligible)**
- One method of distributing tokens to a bunch of users for them to claim is "LinkDrop"

## Creating a unique link for users to claim their NFT (LinkDrop mechanism)
By now, Alice already has a key-value data for a unique identifier (ethereum address/ email / etc.) and token id for the users

What we want to get to is a link like this

```
  https://something.com/claim/<SomethingUniqueOrJustTheTokenId>
```

That takes the user to a page that allows them to claim their own token

We already know we can query the metadata for the token id from the smart contract
```
  await contract.tokenURI(tokenId) ==> which should point us to the json data
```

## And we're done!
So on the client application (frontend "claim" page) that we share with users for them to claim

<details>
  <summary>
    We query the smart contract for `TokenId` in the route (https://something.com/claim/<`TokenId`>)
  </summary>
  ```javascript
    await contract.tokenURI(tokenId);
  ```
  & display the returned json metadata on the application
</details>

<details>
  <summary>
    The "Mint" or "Claim" button the page will actually first generate the proof (or signature) and then call `mintToken` (or `claim`, or whatever we decide to call our function) on the contract
  </summary>
  ```javascript
    const proof = (await tree).getProof(tokenId);
    await contract.mintToken (address, tokenId, proof);
  ```
</details>

## Resources
- [https://brilliant.org/wiki/merkle-tree/](https://brilliant.org/wiki/merkle-tree/)
- [https://github.com/bitcoinbook/bitcoinbook/blob/develop/ch09.asciidoc#simple_merkle](https://github.com/bitcoinbook/bitcoinbook/blob/develop/ch09.asciidoc#simple_merkle)
- [https://blog.openzeppelin.com/workshop-recap-building-an-nft-merkle-drop/](https://blog.openzeppelin.com/workshop-recap-building-an-nft-merkle-drop/)