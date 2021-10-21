# NFTeasy 

In this guild session, we'll be looking at a few different distribution strategies we can think about as purveyors of the world's most well-understood NFTs. We finished last week by deploying our Opensea-enabled NFT contract on Rinkeby and minting an NFT which had its metadata permanently stored on Arweave. We could call this the "simple minting" approach. The contract itself, and the tasks we've written, can also be used to do batch-minting, but this is essentially the same thing at a slightly larger scale. We mint NFTs from the "block hole" at the heart of the Ethereal Galaxy to an account we control, and then sell or distribute them via Opensea, with the help of native meta-transactions and a smooth UX. However, what if we wanted our users to mint the NFTs themselves?

## Lesson 3 - The Woods Are Lovely, Dark, and Deep

There are three general cases for this kind of buyer-mints-nft approach. The first is that anyone can buy and mint the NFTs you make and upload to some permanent store. We recommend following this [scaffold-eth example](https://github.com/scaffold-eth/scaffold-eth/tree/buyer-mints-nft) if that is what interests you. However, we want to discuss how to distribute NFTs in such a way that they can be used to create community and keep those great vibes frequent. In this case, we only want specific people to be able to mint NFTs. It's not scarcity we care about in this guild: it's _personalisation_.

The other two cases lie within this realm of personalised, communal NFT distribution mechanisms. Either you have all the addresses you need for your distribution (in which case you can use a merkle root in your contract), or you don't (in which case you can use some kind of linkdrop, which makes some security trade-offs, but also has some neat features). The Kernel Gratitude NFTs work with this third case, and allow us to update the merkle root in our contract whenever a new block is mined.

In this session, we'll be discussing how to handle both cases: loading predetermined ETH addresses into your contract as a merkle root, and signing minting authorizations off-chain with an updatable merkle root.

Welcome to the forest of thanks.

