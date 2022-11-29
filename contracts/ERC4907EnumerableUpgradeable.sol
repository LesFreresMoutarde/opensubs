// SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./ERC4907Upgradeable.sol";

contract ERC4907EnumerableUpgradeable is Initializable, ERC4907Upgradeable {

    // Mapping from user to list of used (borrowed) token IDs
    mapping(address => mapping(uint256 => uint256)) private _usedTokens;

    // Mapping from token ID to index of the user tokens list
    mapping(uint256 => uint256) private _usedTokensIndex;

    // Array with all used token ids, used for enumeration
    uint256[] private _allUsedTokens;

    // Mapping from token id to position in the allUsedTokens array
    mapping(uint256 => uint256) private _allUsedTokensIndex;

    // Mapping from address to its number of used tokens
    mapping(address => uint256) private _usedBalances;

    /**
     * @dev Initializes the contract by calling ERC4907Upgradeable initializer.
     */
    function initialize(string calldata name_, string calldata symbol_) internal onlyInitializing {
        ERC4907Upgradeable.__ERC4907_init(name_, symbol_);
    }

    /**
    * @dev Returns the number of used tokens in user's account
    */
    function usedBalanceOf(address user) public view returns (uint256) {
        return _usedBalances[user];
    }

    /**
    * @dev See {ERC4907Upgradeable-setUser}
    */
    function setUser(uint256 tokenId, address user, uint64 expires) public virtual override {
        // TODO call _beforeTokenUse

        ERC4907Upgradeable.setUser(tokenId, user, expires);
    }

    /**
     * @dev Private function to add a token to this extension's ownership-tracking data structures.
     * @param user address representing the new user of the given token ID
     * @param tokenId uint256 ID of the token to be added to the tokens list of the given address
     */
    function _addTokenToUserEnumeration(address user, uint256 tokenId) private {
        uint256 length = usedBalanceOf(user);

        _usedTokens[user][length] = tokenId;
        _usedTokensIndex[tokenId] = length;
    }

    /**
     * @dev Private function to add a token to this extension's token tracking data structures.
     * @param tokenId uint256 ID of the token to be added to the tokens list
     */
    function _addTokenToAllUsedTokensEnumeration(uint256 tokenId) private {
        _allUsedTokensIndex[tokenId] = _allUsedTokens.length;
        _allUsedTokens.push(tokenId);
    }

    /**
     * @dev Private function to remove a token from this extension's usership-tracking data structures. Note that
     * while the token is not assigned a new user, the `_usedTokensIndex` mapping is _not_ updated: this allows for
     * gas optimizations e.g. when performing a transfer operation (avoiding double writes).
     * This has O(1) time complexity, but alters the order of the _usedTokens array.
     * @param user address representing the previous user of the given token ID
     * @param tokenId uint256 ID of the token to be removed from the tokens list of the given address
     */
    function _removeTokenFromUserEnumeration(address user, uint256 tokenId) private {
        // To prevent a gap in user's tokens array, we store the last token in the index of the token to delete, and
        // then delete the last slot (swap and pop).

        uint256 lastTokenIndex = usedBalanceOf(user) - 1;
        uint256 tokenIndex = _usedTokensIndex[tokenId];

        // When the token to delete is the last token, the swap operation is unnecessary
        if (tokenIndex != lastTokenIndex) {
            uint256 lastTokenId = _usedTokens[user][lastTokenIndex];

            _usedTokens[user][tokenIndex] = lastTokenId; // Move the last token to the slot of the to-delete token
            _usedTokensIndex[lastTokenId] = tokenIndex; // Update the moved token's index
        }

        // This also deletes the contents at the last position of the array
        delete _usedTokensIndex[tokenId];
        delete _usedTokens[user][lastTokenIndex];
    }
}
