import {ethers} from 'hardhat';
import chai from 'chai';
import {BabelMerkleMint__factory, BabelMerkleMint} from '../typechain';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
const {expect} = chai;
import {MerkleTree} from 'merkletreejs';
import {keccak256} from 'keccak256';

let Alice: SignerWithAddress;
let Bob: SignerWithAddress; 
let Charlie: SignerWithAddress; 
let Derek: SignerWithAddress;
let Jane: SignerWithAddress;
let babelMerkleMint: BabelMerkleMint;
let babelMerkleMintFactory: BabelMerkleMint__factory;
let merkleTree: MerkleTree;
let members: object;
function hashToken(tokenId: any, account: any) {
  return Buffer.from(ethers.utils.solidityKeccak256(['uint256', 'address'], [tokenId, account]).slice(2), 'hex')
}

describe('babelMerkleMint', () => {
  beforeEach(async() => {
    [Alice, Bob, Charlie, Derek, Jane] = await ethers.getSigners();
    babelMerkleMintFactory = (await ethers.getContractFactory(
      'BabelMerkleMint',
      Alice
    )) as BabelMerkleMint__factory;
    members = {
      '1': Charlie.address,
      '2': Derek.address
    }
    merkleTree = new MerkleTree(
      Object.entries(members)
      .map(
        token => hashToken(...token)
      ), keccak256, { sortPairs: true })
  
    babelMerkleMint = (await babelMerkleMintFactory.connect(Alice).deploy(
      merkleTree.getHexRoot()
    )) as BabelMerkleMint;
    expect(babelMerkleMint.address).to.properAddress;
  })
  it ('Charlie and Derek claim their token', async () => {
    const tokens = Object.entries(members);
    for (let i = 0; i < tokens.length; i++) {
      it('claim', async () => {
        const proof = merkleTree.getHexProof(
          hashToken(tokens[i][0], tokens[i][1])
        )
        await babelMerkleMint.claim(tokens[i][1], tokens[i][0], proof)
        await expect(
          await babelMerkleMint.ownerOf(tokens[i][0])
        ).to.equal(tokens[i][1]);
      })
    }
  })
})
