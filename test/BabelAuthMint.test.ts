import {ethers} from 'hardhat';
import chai from 'chai';
import {BabelAuthMint__factory, BabelAuthMint} from '../typechain';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
const {expect} = chai;

let babelAuthMint: BabelAuthMint;
let babelAuthMintFactory: BabelAuthMint__factory;
let Alice: SignerWithAddress;
let Bob: SignerWithAddress; 
let Charlie: SignerWithAddress; 
let Derek: SignerWithAddress;
let chainId: number;
describe('babelAuthMint', () => {

  beforeEach(async () => {
    [Alice, Bob, Charlie, Derek] = await ethers.getSigners();
    babelAuthMintFactory = (await ethers.getContractFactory(
      'BabelAuthMint',
      Alice
    )) as BabelAuthMint__factory;
    babelAuthMint = (await babelAuthMintFactory.connect(Alice).deploy()) as BabelAuthMint;
    expect(babelAuthMint.address).to.properAddress;
    chainId = (await ethers.provider.getNetwork()).chainId;
  })

  describe('assigning minter role', async () => {       
    it ('Giving Bob minter role', async () => {
      await babelAuthMint.connect(Alice).grantRole(await babelAuthMint.MINTER_ROLE(), Bob.address);
      await expect(
        await babelAuthMint.hasRole(
          await babelAuthMint.MINTER_ROLE(),
          Bob.address
        )
      ).to.equal(true)
    })
  })

  describe('minting', async() => {
    beforeEach(async () => {
      await babelAuthMint.connect(Alice).grantRole(
        await babelAuthMint.MINTER_ROLE(), Bob.address
      );
    })
    it('Bob (minter) is able to mint tokens', async () => {
      const tokenId = '1234';
      const sig = await Bob._signTypedData(
        // Domain
        {
          name: 'Babel',
          version: '1.0.0',
          chainId,
          verifyingContract: babelAuthMint.address,
        },
        // Types
        {
          NFT: [
            { name: 'tokenId', type: 'uint256' },
            { name: 'account', type: 'address' },
          ],
        },
        // Value
        { tokenId, account: Bob.address },
      );
      await babelAuthMint.connect(Bob).claim(
        Bob.address, tokenId, sig
      );
      await expect(
        await babelAuthMint.ownerOf(tokenId)
      ).to.equal(Bob.address);
    })
    it('Bob signs authorizations for Charlie and Derek', async () => {
      const members = [
        {
          'address': Charlie.address,
          'tokenId': 12,
          'signer': Charlie
        },
        {
          'address': Derek.address,
          'tokenId': 13,
          'signer': Derek
        }
      ]
      describe('claiming', async () => {
        for (let i = 0; i < members.length; i++) {
          it ('claim', async () => {
            const sig = await Bob._signTypedData(
              // Domain
              {
                name: 'Babel',
                version: '1.0.0',
                chainId,
                verifyingContract: babelAuthMint.address,
              },
              // Types
              {
                NFT: [
                  { name: 'tokenId', type: 'uint256' },
                  { name: 'account', type: 'address' },
                ],
              },
              // Value
              { 
                tokenId: members[i].tokenId,
                account: members[i].address
              },
            );
            await babelAuthMint.connect(members[i].signer).claim(
              members[i].address, members[i].tokenId, sig
            )
            expect(
              await babelAuthMint.ownerOf(members[i].tokenId)
            ).to.equal(members[i].address);
          })
        }
      })
    })
  })
})
