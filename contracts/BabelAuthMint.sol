// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "hardhat/console.sol";

contract BabelAuthMint is ERC721, EIP712, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    constructor()
    ERC721('Babel', 'LIB')
    EIP712('Babel', '1.0.0') {
      _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Link to Contract metadata https://docs.opensea.io/docs/contract-level-metadata
    */
    function contractURI() public pure returns (string memory) {
        return "https://arweave.net/dI21K6IoG8k1kzVUNPswpSgyZ_NktEBqu2KUWbl9zMc";
    }

    function claim(
      address to, 
      uint256 tokenId, 
      bytes calldata proof
    ) external {
      require(_verify(_hash(tokenId, to), proof), "Invalid proof");
      _safeMint(to, tokenId);
    }

    function _hash(uint256 id, address addr)
    internal view returns (bytes32) {
      return _hashTypedDataV4(keccak256(abi.encode(
            keccak256("NFT(uint256 tokenId,address account)"),
            id,
            addr
        )));
    }

    function _verify(bytes32 digest, bytes memory signature)
    internal view returns (bool) {
      return hasRole(
        MINTER_ROLE, 
        ECDSA.recover(digest, signature)
      );
    }
}
