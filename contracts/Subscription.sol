// SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "./ERC4907EnumerableUpgradeable.sol";

contract Subscription is Initializable, ERC4907EnumerableUpgradeable, ERC721EnumerableUpgradeable {

    mapping(uint256 => uint256) private _expirations;

    function initialize(string calldata name_, string calldata symbol_) public initializer {
        ERC4907EnumerableUpgradeable.__ERC4907Enumerable_init(name_, symbol_);
    }

    function setUser(uint256 tokenId, address user, uint64 expires) public override {
        require(user != ownerOf(tokenId), "Cannot use your own token");
        require(block.timestamp >= userExpires(tokenId), "Already used");


        super.setUser(tokenId, user, expires);
    }

    /*
     * @notice Get the user address of an NFT
     * @dev Rewrite of {ERC4907Upgradeable-userOf} to always return the user even if token has expired
     * @param tokenId The NFT to get the user address for
     * @return The user address for this NFT
     */
    function userOf(uint256 tokenId) public view override returns(address) {
        return _users[tokenId].user;
    }

    function expiresAt(uint256 tokenId) public view returns(uint256) {
        return _expirations[tokenId];
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC4907Upgradeable, ERC721EnumerableUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function transferFrom(address from, address to, uint256 tokenId) public override(ERC721Upgradeable, IERC721Upgradeable) {
        revert("Not allowed");
    }

    function safeTransferFrom(address, address to, uint256 tokenId) public override(ERC721Upgradeable, IERC721Upgradeable) {
        revert("Not allowed");
    }

    function safeTransferFrom(address, address to, uint256 tokenId, bytes memory) public virtual override(ERC721Upgradeable, IERC721Upgradeable) {
        revert("Not allowed");
    }
}
