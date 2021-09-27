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
        return "https://arweave.net/dI21K6IoG8k1kzVUNPswpSgyZ_NktEBqu2KUWbl9zMc";
    }
}