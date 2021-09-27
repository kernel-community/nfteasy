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