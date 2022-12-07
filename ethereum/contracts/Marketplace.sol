// SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "./ERC4907EnumerableUpgradeable.sol";

contract Marketplace is Initializable, ERC4907EnumerableUpgradeable {
    struct RentingConditions {
        uint32 price; // Renting price in $ cents
        uint128 duration; // Renting duration in seconds
        uint256 createdAt;
    }

    // Mapping from token  to renting conditions
    mapping(uint256 => RentingConditions) internal _rentingConditions;

    // The minimum price an owner can set for a renting
    uint32 public minRentPrice;

    uint32 public minRentDuration;

    // Array with all token IDs available for renting
    uint256[] private _allAvailableForRenting;

    // Mapping from token ID to position in the allAvailable array
    mapping(uint256 => uint256) private _allAvailableForRentingIndex;

    event RentOfferCreated(uint256 tokenId);

    event RentOfferCancelled(uint256 tokenId);

    function __Marketplace_init(uint32 minRentPrice_, uint32 minRentDuration_) internal onlyInitializing {
        minRentPrice = minRentPrice_;
        minRentDuration = minRentDuration_;
    }

    function offerForRent(uint256 tokenId, uint32 price, uint128 duration) public virtual {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Caller is not token owner or approved");
        require(userOf(tokenId) == address(0), "Already used");
        require(price >= minRentPrice, "Price too low");
        require(duration >= minRentDuration, "Duration too low");

        RentingConditions memory rentingConditions = RentingConditions(price, duration, block.timestamp);

        _rentingConditions[tokenId] = rentingConditions;

        _addTokenToAvailableTokensEnumeration(tokenId);

        emit RentOfferCreated(tokenId);
    }

    function cancelOfferForRent(uint256 tokenId) public {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Caller is not token owner or approved");

        _deleteRentingConditions(tokenId);

        emit RentOfferCancelled(tokenId);
    }

    function getAvailableTokenCount() public view returns (uint256) {
        return _allAvailableForRenting.length;
    }

    function getAvailableTokenIdAtIndex(uint256 index) public view returns (uint256) {
        return _allAvailableForRenting[index];
    }

    function getRentingConditions(uint256 tokenId) public view returns (RentingConditions memory) {
        return _rentingConditions[tokenId];
    }

    function _deleteRentingConditions(uint256 tokenId) internal {
        delete _rentingConditions[tokenId];
        _removeTokenFromAvailableTokensEnumeration(tokenId);
    }

    /**
     * @dev Private function to add a token to this extension's token tracking data structures.
     * @param tokenId uint256 ID of the token to be added to the tokens list
     */
    function _addTokenToAvailableTokensEnumeration(uint256 tokenId) internal {
        _allAvailableForRentingIndex[tokenId] = _allAvailableForRenting.length;
        _allAvailableForRenting.push(tokenId);
    }

    /**
     * @dev Private function to remove a token from this extension's token tracking data structures.
     * This has O(1) time complexity, but alters the order of the _allAvailableForRenting array.
     * @param tokenId uint256 ID of the token to be removed from the tokens list
     */
    function _removeTokenFromAvailableTokensEnumeration(uint256 tokenId) internal {
        // To prevent a gap in the tokens array, we store the last token in the index of the token to delete, and
        // then delete the last slot (swap and pop).

        uint256 lastTokenIndex = _allAvailableForRenting.length - 1;
        uint256 tokenIndex = _allAvailableForRentingIndex[tokenId];

        uint256 lastTokenId = _allAvailableForRenting[lastTokenIndex];

        _allAvailableForRenting[tokenIndex] = lastTokenId; // Move the last token to the slot of the to-delete token
        _allAvailableForRentingIndex[lastTokenId] = tokenIndex; // Update the moved token's index

        // This also deletes the contents at the last position of the array
        delete _allAvailableForRentingIndex[tokenId];
        _allAvailableForRenting.pop();
    }
}
