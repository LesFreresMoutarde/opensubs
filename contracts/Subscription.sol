// SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "./ERC4907EnumerableUpgradeable.sol";
import "./Marketplace.sol";

contract Subscription is Initializable, ERC4907EnumerableUpgradeable, ERC721EnumerableUpgradeable, Marketplace {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    uint256 private constant RENTING_REQUEST_TIMEOUT = 120; // Number of seconds a request is valid

    uint256 private constant CONTENT_PROVIDER_COMMISSION_PERCENTAGE = 15; // 15%

    uint256 private constant MARKETPLACE_PROVIDER_COMMISSION_PERCENTAGE = 15; // 15%

    struct RentingRequest {
        uint256 tokenId;
        uint256 price; // Renting price in wei
        uint256 expires; // Expiration timestamp of the request
    }

    CountersUpgradeable.Counter private _tokenIds;

    CountersUpgradeable.Counter private _rentingRequestIds;

    // Mapping from tokenId to subscription expiration timestamp
    mapping(uint256 => uint256) private _expirations;

    // Mapping from renting request ID to the renting request data
    mapping(uint256 => RentingRequest) private _rentingRequests;

    // The address of the entity providing content or service
    address private _contentProvider;

    // The address of the subscription renting system provider
    address private _marketplaceProvider;

    // Mapping from address to balance in wei
    mapping(address => uint256) public balances;

    event RentingRequestCreated(uint256 requestId, uint256 price, uint256 expires);

    function initialize(
        string calldata name_,
        string calldata symbol_,
        address contentProvider_,
        address marketplaceProvider_
    ) public initializer {
        ERC4907EnumerableUpgradeable.__ERC4907Enumerable_init(name_, symbol_);
        Marketplace.__Marketplace_init();

        _contentProvider = contentProvider_;
        _marketplaceProvider = marketplaceProvider_;

        _tokenIds.increment();
        _rentingRequestIds.increment();
    }

    function mint() public {
        _safeMint(msg.sender, _tokenIds.current());

        _tokenIds.increment();
    }

    function setUser(uint256 tokenId, address user, uint64 expires) public override {
        require(user != ownerOf(tokenId), "Cannot use your own token");
        require(block.timestamp >= userExpires(tokenId), "Already used");

        super.setUser(tokenId, user, expires);
    }

    function withdraw() public {
        uint256 value = balances[msg.sender];

        require(value > 0, "Nothing to withdraw");

        balances[msg.sender] = 0;

        (bool sent,) = msg.sender.call{value: value}("");

        require(sent, "Failed to send Ether");
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

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC4907Upgradeable, ERC721Upgradeable, ERC721EnumerableUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize) internal override(ERC721Upgradeable, ERC721EnumerableUpgradeable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function transferFrom(address, address, uint256) public pure override(ERC721Upgradeable, IERC721Upgradeable) {
        revert("Not allowed");
    }

    function safeTransferFrom(address, address, uint256) public pure override(ERC721Upgradeable, IERC721Upgradeable) {
        revert("Not allowed");
    }

    function safeTransferFrom(address, address, uint256, bytes memory) public pure override(ERC721Upgradeable, IERC721Upgradeable) {
        revert("Not allowed");
    }
}
