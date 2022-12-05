// SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "./IERC4907.sol";

contract ERC4907Upgradeable is Initializable, IERC4907, ERC721Upgradeable {

    struct UserInfo {
        address user;   // address of user role
        uint64 expires; // unix timestamp, user expires
    }

    mapping(uint256 => UserInfo) internal _users;

    /**
     * @dev Initializes the contract by calling ERC721Upgradeable initializer.
     */
    function __ERC4907_init(string calldata name_, string calldata symbol_) internal onlyInitializing {
        ERC721Upgradeable.__ERC721_init(name_, symbol_);
    }

    /// @notice set the user and expires of an NFT
    /// @dev The zero address indicates there is no user
    /// Throws if `tokenId` is not valid NFT
    /// @param user  The new user of the NFT
    /// @param expires  UNIX timestamp, The new user could use the NFT before expires
    function setUser(uint256 tokenId, address user, uint64 expires) public virtual {
        if (user != address(0)) {
            require(expires > block.timestamp, "Expired timestamp");
        }

        UserInfo storage info = _users[tokenId];

        info.user = user;

        if (user == address(0)) {
            info.expires = 0;
        } else {
            info.expires = expires;
        }

        emit UpdateUser(tokenId, user, expires);
    }

    /// @notice Get the user address of an NFT
    /// @dev The zero address indicates that there is no user or the user is expired
    /// @param tokenId The NFT to get the user address for
    /// @return The user address for this NFT
    function userOf(uint256 tokenId) public view virtual returns (address) {
        if (uint256(_users[tokenId].expires) >= block.timestamp) {
            return _users[tokenId].user;
        } else {
            return address(0);
        }
    }

    /// @notice Get the user expires of an NFT
    /// @dev The zero value indicates that there is no user
    /// @param tokenId The NFT to get the user expires for
    /// @return The user expires for this NFT
    function userExpires(uint256 tokenId) public view virtual returns (uint256) {
        return _users[tokenId].expires;
    }

    /// @dev See {IERC165-supportsInterface}.
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IERC4907).interfaceId || super.supportsInterface(interfaceId);
    }
}
