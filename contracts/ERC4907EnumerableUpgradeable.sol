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
}
