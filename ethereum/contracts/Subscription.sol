// SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "./ERC4907EnumerableUpgradeable.sol";
import "./Marketplace.sol";

contract Subscription is Initializable, ERC4907EnumerableUpgradeable, ERC721EnumerableUpgradeable, Marketplace {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    uint256 private constant RENTING_REQUEST_TIMEOUT = 120; // Number of seconds a request is valid

    uint8 private constant CONTENT_PROVIDER_RENTING_COMMISSION_PERCENTAGE = 15; // 15%

    uint8 private constant MARKETPLACE_PROVIDER_RENTING_COMMISSION_PERCENTAGE = 15; // 15%

    uint8 private constant MARKETPLACE_PROVIDER_MINT_COMMISSION_PERMILLE = 25; // 2.5%

    AggregatorV3Interface internal priceFeed;

    CountersUpgradeable.Counter private _tokenIds;

    // The duration of the subscription
    uint32 public contentSubscriptionDuration;

    // Mapping from tokenId to subscription expiration timestamp
    mapping(uint256 => uint256) private _expirations;

    // The price of a minted subscription in $ cents for 30 days
    uint32 public contentSubscriptionPrice;

    // The allowed slippage when a subscription is minted or rented per ‰ (1000)
    uint8 private _allowedSlippage;

    // The address of the entity providing content or service
    address private _contentProvider;

    // The address of the subscription renting system provider
    address private _marketplaceProvider;

    // Mapping from address to balance in wei
    mapping(address => uint256) public balances;

    function initialize(
        string calldata name_,
        string calldata symbol_,
        uint32 contentSubscriptionPrice_,
        uint32 contentSubscriptionDuration_,
        uint32 minRentPrice_,
        uint32 minRentDuration_,
        address contentProvider_,
        address marketplaceProvider_,
        address priceFeedAddress_
    ) public initializer {
        ERC4907EnumerableUpgradeable.__ERC4907Enumerable_init(name_, symbol_);
        Marketplace.__Marketplace_init(minRentPrice_, minRentDuration_);

        contentSubscriptionPrice = contentSubscriptionPrice_;
        contentSubscriptionDuration = contentSubscriptionDuration_;
        _contentProvider = contentProvider_;
        _marketplaceProvider = marketplaceProvider_;
        priceFeed = AggregatorV3Interface(priceFeedAddress_);
        _allowedSlippage = 5;

        _tokenIds.increment();
    }

    function mint() public payable {
        // Chainlink returns amount of wei for 1 USD
        (,int256 exchangeRateFromChainlink,,,) = priceFeed.latestRoundData();

        assert(exchangeRateFromChainlink > 0);

        uint8 decimals = priceFeed.decimals();

//        uint256 mintingPrice = (uint256(exchangeRateFromChainlink) * contentSubscriptionPrice) / 100;
        uint256 mintingPrice = ((contentSubscriptionPrice / 100) * 1 ether) / uint256(exchangeRateFromChainlink) * 10 ** decimals;

        uint256 minMintingPrice = mintingPrice * (1000 - _allowedSlippage) / 1000;
        uint256 maxMintingPrice = mintingPrice * (1000 + _allowedSlippage) / 1000;

        require(msg.value >= minMintingPrice && msg.value <= maxMintingPrice, "Too much slippage");

        uint256 marketplaceProviderCommission = msg.value * MARKETPLACE_PROVIDER_MINT_COMMISSION_PERMILLE / 1000;
        uint256 contentProviderRevenue = msg.value - marketplaceProviderCommission;

        balances[_marketplaceProvider] += marketplaceProviderCommission;
        balances[_contentProvider] += contentProviderRevenue;

        uint256 tokenId = _tokenIds.current();

        _expirations[tokenId] = block.timestamp + contentSubscriptionDuration;

        _safeMint(msg.sender, tokenId);

        _tokenIds.increment();
    }

    function offerForRent(uint256 tokenId, uint32 price, uint128 duration) public override {
        uint64 expires = uint64(block.timestamp + duration);

        uint256 subscriptionExpiration = _expirations[tokenId];

        require(expires < subscriptionExpiration, "Subscription will expire before rent expires");

        super.offerForRent(tokenId, price, duration);
    }

    // Wrapper for setUser function called by a user who wants to use a token proposed for rental
    function rent(uint256 tokenId) public payable {
        RentingConditions memory rentingConditions = _rentingConditions[tokenId];

        require(rentingConditions.createdAt != 0, "Not available for renting");

        uint64 expires = uint64(block.timestamp + rentingConditions.duration);

        uint256 subscriptionExpiration = _expirations[tokenId];

        require(expires < subscriptionExpiration, "Subscription expires before rent expires");

        setUser(tokenId, msg.sender, expires);
    }

    // Wrapper for setUser function called by a token owner who wants to reclaim his token after a rental
    function reclaim(uint256 tokenId) public {
        setUser(tokenId, address(0), 0);
    }

    // This function must not be called directly to rent a token
    // because it is not payable but it needs to receive an ETH value
    function setUser(uint256 tokenId, address user, uint64 expires) public override {
        require(user != ownerOf(tokenId), "Cannot use your own token");
        require(block.timestamp >= userExpires(tokenId), "Already used");

        if (user == address(0)) {
            require(_isApprovedOrOwner(_msgSender(), tokenId), "Caller is not token owner or approved");
        } else {
            _checkRentingPrice(tokenId);
            _dispatchCommissions(tokenId);
            _deleteRentingConditions(tokenId);
        }

        super.setUser(tokenId, user, expires);
    }

    function _checkRentingPrice(uint256 tokenId) private {
        require(msg.value > 0, "No value received");

        RentingConditions memory rentingConditions = _rentingConditions[tokenId];

        // Chainlink returns amount of wei for 1 USD
        (,int256 exchangeRateFromChainlink,,,) = priceFeed.latestRoundData();

        assert(exchangeRateFromChainlink > 0);

        uint8 decimals = priceFeed.decimals();

//        uint256 rentingPrice = (uint256(exchangeRateFromChainlink) * rentingConditions.price) / 100;
        uint256 rentingPrice = ((rentingConditions.price / 100) * 1 ether) / uint256(exchangeRateFromChainlink) * 10 ** decimals;

        uint256 minRentingPrice = rentingPrice * (1000 - _allowedSlippage) / 1000;
        uint256 maxRentingPrice = rentingPrice * (1000 + _allowedSlippage) / 1000;

        require(msg.value >= minRentingPrice && msg.value <= maxRentingPrice, "Too much slippage");
    }

    function _dispatchCommissions(uint256 tokenId) private {
        address tokenOwner = ownerOf(tokenId);

        uint256 contentProviderCommission = msg.value * CONTENT_PROVIDER_RENTING_COMMISSION_PERCENTAGE / 100;
        uint256 marketplaceProviderCommission = msg.value * MARKETPLACE_PROVIDER_RENTING_COMMISSION_PERCENTAGE / 100;
        uint256 tokenOwnerRevenue = msg.value - (contentProviderCommission + marketplaceProviderCommission);

        balances[_contentProvider] += contentProviderCommission;
        balances[_marketplaceProvider] += marketplaceProviderCommission;
        balances[tokenOwner] += tokenOwnerRevenue;
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

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC4907Upgradeable, ERC721EnumerableUpgradeable) returns (bool) {
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
