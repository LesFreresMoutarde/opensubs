// SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";

contract Marketplace is Initializable {
    struct RentingConditions {
        uint32 price; // Renting price in $ cents
        uint128 duration; // Renting duration in seconds
        uint256 createdAt;
    }

    // Mapping from token  to renting conditions
    mapping(uint256 => RentingConditions) internal _rentingConditions;

    // The minimum price an owner can set for a renting
    uint32 public minRentPrice;

    // The minimum duration an owner can set for a renting
    uint32 public minRentDuration;

    // Array with all token IDs available for renting
    uint256[] private _allAvailableForRenting;

    // Mapping from token ID to position in the allAvailable array
    mapping(uint256 => uint256) private _allAvailableForRentingIndex;

    uint256[49] private __gap;

    // Logged when a token owner creates a rent offer
    /// @notice when the owner of `tokenId` creates a rent offer for this token
    event RentOfferCreated(uint256 tokenId);

    // Logged when the rent offer of a token is deleted
    /// @notice when the owner of `tokenId` cancels a rent offer for this token
    event RentOfferCancelled(uint256 tokenId);

    /**
     * @dev Initializes the contract by setting a `minRentPrice` and a `minRentDuration`.
     */
    function __Marketplace_init(uint32 minRentPrice_, uint32 minRentDuration_) internal onlyInitializing {
        minRentPrice = minRentPrice_;
        minRentDuration = minRentDuration_;
    }

    /**
     * @dev Creates an offer for rent for `tokenId` with a `price` and a rental `duration`.
     */
    function offerForRent(uint256 tokenId, uint32 price, uint128 duration) public virtual {
        require(price >= minRentPrice, "Price too low");
        require(duration >= minRentDuration, "Duration too low");

        RentingConditions memory rentingConditions = RentingConditions(price, duration, block.timestamp);

        _rentingConditions[tokenId] = rentingConditions;

        _addTokenToAvailableTokensEnumeration(tokenId);

        emit RentOfferCreated(tokenId);
    }

    /**
     * @dev Cancels the offer for rent for `tokenId` by deleting values in `_rentingConditions[tokenId]`.
     */
    function cancelOfferForRent(uint256 tokenId) public virtual {
        _deleteRentingConditions(tokenId);

        emit RentOfferCancelled(tokenId);
    }

    /**
     * @dev Returns the number of tokenIds in `_allAvailableForRenting`.
     */
    function getAvailableTokenCount() public view returns (uint256) {
        return _allAvailableForRenting.length;
    }

    /**
     * @dev Returns a token ID available for renting at a given `index` of available token list.
     * Use along with {getAvailableTokenCount} to enumerate all available tokens.
     */
    function getAvailableTokenIdAtIndex(uint256 index) public view returns (uint256) {
        return _allAvailableForRenting[index];
    }

    /**
     * @dev Returns a RentingConditions struct for given `tokenId`.
     */
    function getRentingConditions(uint256 tokenId) public view returns (RentingConditions memory) {
        return _rentingConditions[tokenId];
    }

    /**
     * @dev Deletes values in `_rentingConditions[tokenId]` and removes `tokenId` from all available token list.
     */
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
