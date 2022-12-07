import {ethers, upgrades} from "hardhat";
import { expect } from "chai";
import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import {Subscription} from "../typechain-types";
import {BigNumber} from "ethers";

const chainlinkGoerliPriceFeedForEthUsdAddress: string = "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e";

const aggregatorV3InterfaceABI = [
    {
        inputs: [],
        name: "decimals",
        outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "description",
        outputs: [{ internalType: "string", name: "", type: "string" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ internalType: "uint80", name: "_roundId", type: "uint80" }],
        name: "getRoundData",
        outputs: [
            { internalType: "uint80", name: "roundId", type: "uint80" },
            { internalType: "int256", name: "answer", type: "int256" },
            { internalType: "uint256", name: "startedAt", type: "uint256" },
            { internalType: "uint256", name: "updatedAt", type: "uint256" },
            { internalType: "uint80", name: "answeredInRound", type: "uint80" },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "latestRoundData",
        outputs: [
            { internalType: "uint80", name: "roundId", type: "uint80" },
            { internalType: "int256", name: "answer", type: "int256" },
            { internalType: "uint256", name: "startedAt", type: "uint256" },
            { internalType: "uint256", name: "updatedAt", type: "uint256" },
            { internalType: "uint80", name: "answeredInRound", type: "uint80" },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "version",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
]

describe("Subscription smart contract test", () => {
    async function deploySubscriptionFixture() {
        const Subscription = await ethers.getContractFactory("Subscription");

        const [owner, netflix, marketplace, ...otherAccounts] = await ethers.getSigners();

        const contentSubscriptionPrice = 1549; // $15,49
        const contentSubscriptionDuration = 30 * 24 * 60 * 60 ; // 1 month
        const minRentPrice = 100; // $1
        const minRentDuration = 60; // 1 minute

        const subscription = await upgrades.deployProxy(
            Subscription,
            ["Fakeflix", "FLX", contentSubscriptionPrice, contentSubscriptionDuration, minRentPrice, minRentDuration, netflix.address, marketplace.address, chainlinkGoerliPriceFeedForEthUsdAddress],
            { initializer: 'initialize', kind: 'transparent'}
        ) as Subscription;

        await subscription.deployed();

        return {subscription, owner, netflix, marketplace, otherAccounts};
    }

    describe("Mint", async () => {
        it("Should mint a token", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixture);

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            const provider = ethers.getDefaultProvider("http://localhost:8545");

            const priceFeed = new ethers.Contract(chainlinkGoerliPriceFeedForEthUsdAddress, aggregatorV3InterfaceABI, provider);

            const roundData = await priceFeed.latestRoundData();

            const contentSubscriptionPrice = await connectedSubscription.contentSubscriptionPrice();

            const amountToSend = Math.floor(roundData.answer * contentSubscriptionPrice / 100);

            await expect(connectedSubscription.mint({value: amountToSend}))
                .to.emit(connectedSubscription, "Transfer")
                .withArgs(ethers.constants.AddressZero, otherAccounts[0].address, 1);

            await expect(connectedSubscription.mint({value: amountToSend}))
                .to.emit(connectedSubscription, "Transfer")
                .withArgs(ethers.constants.AddressZero, otherAccounts[0].address, 2);
        });

        it("Should update balances when a token is minted", async () => {
            const {subscription, netflix, marketplace, otherAccounts} = await loadFixture(deploySubscriptionFixture);

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            const provider = ethers.getDefaultProvider("http://localhost:8545");

            const priceFeed = new ethers.Contract(chainlinkGoerliPriceFeedForEthUsdAddress, aggregatorV3InterfaceABI, provider);

            const roundData = await priceFeed.latestRoundData();

            const contentSubscriptionPrice = await connectedSubscription.contentSubscriptionPrice();

            const amountToSend = Math.floor(roundData.answer * contentSubscriptionPrice / 100);

            // Check balances before minting

            const netflixBalanceBeforeRenting = await subscription.balances(netflix.address);
            const marketplaceBalanceBeforeRenting = await subscription.balances(marketplace.address);

            // Send transaction to mint token

            await connectedSubscription.mint({value: amountToSend});

            // Check balances after minting

            const marketplaceCommission = Math.floor(amountToSend * 0.025);
            const netflixRevenue = amountToSend - marketplaceCommission;

            const marketplaceBalanceAfterRenting = await subscription.balances(marketplace.address);
            const netflixBalanceAfterRenting = await subscription.balances(netflix.address);

            expect(marketplaceBalanceAfterRenting).equal(marketplaceBalanceBeforeRenting.add(marketplaceCommission));
            expect(netflixBalanceAfterRenting).equal(netflixBalanceBeforeRenting.add(netflixRevenue));
        });

        it("Should mint a token when value sent is higher than required one but still in slippage interval", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixture);

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            const provider = ethers.getDefaultProvider("http://localhost:8545");

            const priceFeed = new ethers.Contract(chainlinkGoerliPriceFeedForEthUsdAddress, aggregatorV3InterfaceABI, provider);

            const roundData = await priceFeed.latestRoundData();

            const contentSubscriptionPrice = await connectedSubscription.contentSubscriptionPrice();

            const amountToSend = Math.floor(roundData.answer * contentSubscriptionPrice / 100);

            await expect(connectedSubscription.mint({value: amountToSend + 10000}))
                .to.emit(connectedSubscription, "Transfer")
                .withArgs(ethers.constants.AddressZero, otherAccounts[0].address, 1);
        });

        it("Should mint a token when value sent is lower than required one but still in slippage interval", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixture);

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            const provider = ethers.getDefaultProvider("http://localhost:8545");

            const priceFeed = new ethers.Contract(chainlinkGoerliPriceFeedForEthUsdAddress, aggregatorV3InterfaceABI, provider);

            const roundData = await priceFeed.latestRoundData();

            const contentSubscriptionPrice = await connectedSubscription.contentSubscriptionPrice();

            const amountToSend = Math.floor(roundData.answer * contentSubscriptionPrice / 100);

            await expect(connectedSubscription.mint({value: amountToSend - 10000}))
                .to.emit(connectedSubscription, "Transfer")
                .withArgs(ethers.constants.AddressZero, otherAccounts[0].address, 1);
        });

        it("Should revert when no value is passed at mint", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixture);

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            await expect(connectedSubscription.mint())
                .to.be.revertedWith("Too much slippage");
        });

        it("Should revert when value passed at mint is higher than expected in slippage interval", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixture);

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            const provider = ethers.getDefaultProvider("http://localhost:8545");

            const priceFeed = new ethers.Contract(chainlinkGoerliPriceFeedForEthUsdAddress, aggregatorV3InterfaceABI, provider);

            const roundData = await priceFeed.latestRoundData();

            const contentSubscriptionPrice = await connectedSubscription.contentSubscriptionPrice();

            const amountToSend = Math.floor(roundData.answer * contentSubscriptionPrice / 100);

            await expect(connectedSubscription.mint({value: amountToSend * 2}))
                .to.be.revertedWith("Too much slippage");
        });

        it("Should revert when value passed at mint is lower than expected in slippage interval", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixture);

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            const provider = ethers.getDefaultProvider("http://localhost:8545");

            const priceFeed = new ethers.Contract(chainlinkGoerliPriceFeedForEthUsdAddress, aggregatorV3InterfaceABI, provider);

            const roundData = await priceFeed.latestRoundData();

            const contentSubscriptionPrice = await connectedSubscription.contentSubscriptionPrice();

            const amountToSend = Math.floor(roundData.answer * contentSubscriptionPrice / 100);

            await expect(connectedSubscription.mint({value: Math.floor(amountToSend / 2)}))
                .to.be.revertedWith("Too much slippage");
        });
    });

    describe("Renting", async () => {
        async function deploySubscriptionFixtureAndMint() {
            const {subscription, owner, netflix, marketplace, otherAccounts} = await loadFixture(deploySubscriptionFixture);

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            const provider = ethers.getDefaultProvider("http://localhost:8545");

            const priceFeed = new ethers.Contract(chainlinkGoerliPriceFeedForEthUsdAddress, aggregatorV3InterfaceABI, provider);

            const roundData = await priceFeed.latestRoundData();

            const contentSubscriptionPrice = await connectedSubscription.contentSubscriptionPrice();

            const amountToSend = Math.floor(roundData.answer * contentSubscriptionPrice / 100);

            await connectedSubscription.mint({value: amountToSend});

            return {subscription, owner, netflix, marketplace, otherAccounts};
        }

        async function deploySubscriptionFixtureAndMintMultipleAndSetUsers() {
            const {subscription, owner, netflix, marketplace, otherAccounts} = await loadFixture(deploySubscriptionFixture);

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            const provider = ethers.getDefaultProvider("http://localhost:8545");

            const priceFeed = new ethers.Contract(chainlinkGoerliPriceFeedForEthUsdAddress, aggregatorV3InterfaceABI, provider);

            const roundData = await priceFeed.latestRoundData();

            const contentSubscriptionPrice = await connectedSubscription.contentSubscriptionPrice();

            const amountToSendForMint = Math.floor(roundData.answer * contentSubscriptionPrice / 100);

            const tokenIds = [...Array(20).keys()].map(item => item+1);

            const rentalPrice = 1000; // $10
            const rentalDuration = 3600; // 1h

            for (let i = 0; i < tokenIds.length; i++) {
                await connectedSubscription.mint({value: amountToSendForMint});
                await connectedSubscription.offerForRent(tokenIds[i], rentalPrice, rentalDuration);
            }

            let i: number = 0;

            const amountToSendForRental = Math.floor(roundData.answer * rentalPrice / 100);

            // Add 5 tokens to each address

            const account1ConnectedSubscription = subscription.connect(otherAccounts[1]);
            const account2ConnectedSubscription = subscription.connect(otherAccounts[2]);
            const account3ConnectedSubscription = subscription.connect(otherAccounts[3]);
            const account4ConnectedSubscription = subscription.connect(otherAccounts[4]);

            for (i; i < 5; i++) {
                await account1ConnectedSubscription.rent(tokenIds[i], {value: amountToSendForRental});
            }

            for (i; i < 10; i++) {
                await account2ConnectedSubscription.rent(tokenIds[i], {value: amountToSendForRental});
            }

            for (i; i < 15; i++) {
                await account3ConnectedSubscription.rent(tokenIds[i], {value: amountToSendForRental});
            }

            for (i; i < 20; i++) {
                await account4ConnectedSubscription.rent(tokenIds[i], {value: amountToSendForRental});
            }

            const expires = await time.latest() + rentalDuration;

            return {subscription, owner, netflix, marketplace, otherAccounts, expires};
        }

        /** CREATING RENTAL OFFER **/

        it("Should emit event when offer for rent is successfully created by owner", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixtureAndMint);

            const tokenId = 1;

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            const minPrice = await connectedSubscription.minRentPrice();

            await expect(connectedSubscription.offerForRent(tokenId,  minPrice * 5,3600))
                .to.emit(connectedSubscription, 'RentOfferCreated')
                .withArgs(tokenId);
        });

        it("Should emit event when offer for rent is successfully created by approved address", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixtureAndMint);

            const tokenId = 1;

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            await connectedSubscription.approve(otherAccounts[2].address, tokenId);

            const approvedConnectedSubscription = subscription.connect(otherAccounts[2]);

            const minPrice = await approvedConnectedSubscription.minRentPrice();

            await expect(approvedConnectedSubscription.offerForRent(tokenId,  minPrice * 5,3600))
                .to.emit(approvedConnectedSubscription, 'RentOfferCreated')
                .withArgs(tokenId);
        });

        it("Should revert when not approved address for a token tries to create offer for rent", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixtureAndMint);

            const tokenId = 1;

            const approvedConnectedSubscription = subscription.connect(otherAccounts[2]);

            const minPrice = await approvedConnectedSubscription.minRentPrice();

            await expect(approvedConnectedSubscription.offerForRent(tokenId,  minPrice * 5,3600))
                .to.be.revertedWith("Caller is not token owner or approved");
        });

        it("Should revert when renting price is too low", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixtureAndMint);

            const tokenId = 1;

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            const minPrice = await connectedSubscription.minRentPrice();

            await expect(connectedSubscription.offerForRent(tokenId,  minPrice - 1,3600))
                .to.be.revertedWith("Price too low");
        });

        it("Should revert when renting duration is too low", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixtureAndMint);

            const tokenId = 1;

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            const minDuration = await connectedSubscription.minRentDuration();

            await expect(connectedSubscription.offerForRent(tokenId, 1000, minDuration - 1))
                .to.be.revertedWith("Duration too low");
        });

        it("Should revert when renting duration is too high regarding subscription expiration time", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixtureAndMint);

            const tokenId = 1;

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            const minPrice = await connectedSubscription.minRentPrice();

            const expirationTimestamp = await connectedSubscription.expiresAt(tokenId);

            const currentTimestamp = await time.latest();

            const duration = expirationTimestamp.sub(currentTimestamp).add(30);

            await expect(connectedSubscription.offerForRent(tokenId,  minPrice * 5, duration))
                .to.be.revertedWith("Subscription will expire before rent expires");
        });

        it("Should emit event when offer for rent is cancelled", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixtureAndMint);

            const tokenId = 1;

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            const minPrice = await connectedSubscription.minRentPrice();

            await connectedSubscription.offerForRent(tokenId,  minPrice + 1000,3600);

            await expect(connectedSubscription.cancelOfferForRent(tokenId))
                .to.emit(connectedSubscription, 'RentOfferCancelled')
                .withArgs(tokenId);
        });

        it("Should revert when not approved address tries to cancel offer for rent", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixtureAndMint);

            const tokenId = 1;

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            const minPrice = await connectedSubscription.minRentPrice();

            await connectedSubscription.offerForRent(tokenId,  minPrice + 1000,3600);

            const notApprovedSubscription = subscription.connect(otherAccounts[2]);

            await expect(notApprovedSubscription.cancelOfferForRent(tokenId))
                .to.be.revertedWith("Caller is not token owner or approved");
        });

        /** RENTING **/

        it("Should revert if setUser function is called directly", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixtureAndMint);

            const tokenId = 1;

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            const minPrice = await connectedSubscription.minRentPrice();

            await connectedSubscription.offerForRent(tokenId,  minPrice * 5,3600);

            const currentTimestamp = await time.latest();

            const expires = currentTimestamp + 20; // 20 seconds more

            await expect(connectedSubscription.setUser(tokenId, otherAccounts[1].address, expires))
                .to.be.revertedWith("No value received");
        });

        it("Should emit event when token is rented", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixtureAndMint);

            const tokenId = 1;

            // Offer for rent

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            const minPrice = await connectedSubscription.minRentPrice();

            await connectedSubscription.offerForRent(tokenId,  minPrice * 5, 3600);

            // Get renting conditions

            const userConnectedSubscription = subscription.connect(otherAccounts[1]);

            const rentingConditions = await userConnectedSubscription.getRentingConditions(tokenId);

            // Compute ETH amount to send from subscription renting conditions

            const provider = ethers.getDefaultProvider("http://localhost:8545");

            const priceFeed = new ethers.Contract(chainlinkGoerliPriceFeedForEthUsdAddress, aggregatorV3InterfaceABI, provider);

            const roundData = await priceFeed.latestRoundData();

            const rentingPrice = rentingConditions.price

            const amountToSend = Math.floor(roundData.answer * rentingPrice / 100);

            const currentTimestamp = await time.latest();
            const blockTime = 20;

            // Force next block timestamp to guess renting expiration time
            time.setNextBlockTimestamp(currentTimestamp + blockTime);

            const expires = BigNumber.from(currentTimestamp)
                .add(blockTime)
                .add(rentingConditions.duration);

            // Send transaction to rent token

            const currentUserOfMintedToken = await connectedSubscription.userOf(tokenId);

            expect(currentUserOfMintedToken).to.equal(ethers.constants.AddressZero);

            await expect(userConnectedSubscription.rent(tokenId, {value: amountToSend}))
                .to.emit(connectedSubscription, "UpdateUser")
                .withArgs(tokenId, otherAccounts[1].address, expires);

            const newUserOfMintedToken = await connectedSubscription.userOf(tokenId);

            expect(newUserOfMintedToken).to.equal(otherAccounts[1].address);

            const usedBalanceOfNewUser = await connectedSubscription.usedBalanceOf(otherAccounts[1].address);

            expect(usedBalanceOfNewUser).to.equal(1);

            const expirationTime = await connectedSubscription.userExpires(tokenId);

            expect(expirationTime).to.equal(expires);
        });

        it("Should rent a token when value sent is lower than required one but still in slippage interval", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixtureAndMint);

            const tokenId = 1;

            // Offer for rent

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            const minPrice = await connectedSubscription.minRentPrice();

            await connectedSubscription.offerForRent(tokenId,  minPrice * 5, 3600);

            // Get renting conditions

            const userConnectedSubscription = subscription.connect(otherAccounts[1]);

            const rentingConditions = await userConnectedSubscription.getRentingConditions(tokenId);

            // Compute ETH amount to send from subscription renting conditions

            const provider = ethers.getDefaultProvider("http://localhost:8545");

            const priceFeed = new ethers.Contract(chainlinkGoerliPriceFeedForEthUsdAddress, aggregatorV3InterfaceABI, provider);

            const roundData = await priceFeed.latestRoundData();

            const rentingPrice = rentingConditions.price

            const amountToSend = Math.floor(roundData.answer * rentingPrice / 100);

            await expect(userConnectedSubscription.rent(tokenId, {value: amountToSend - 10000}))
                .to.emit(connectedSubscription, "UpdateUser");
        });

        it("Should rent a token when value sent is higher than required one but still in slippage interval", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixtureAndMint);

            const tokenId = 1;

            // Offer for rent

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            const minPrice = await connectedSubscription.minRentPrice();

            await connectedSubscription.offerForRent(tokenId,  minPrice * 5, 3600);

            // Get renting conditions

            const userConnectedSubscription = subscription.connect(otherAccounts[1]);

            const rentingConditions = await userConnectedSubscription.getRentingConditions(tokenId);

            // Compute ETH amount to send from subscription renting conditions

            const provider = ethers.getDefaultProvider("http://localhost:8545");

            const priceFeed = new ethers.Contract(chainlinkGoerliPriceFeedForEthUsdAddress, aggregatorV3InterfaceABI, provider);

            const roundData = await priceFeed.latestRoundData();

            const rentingPrice = rentingConditions.price

            const amountToSend = Math.floor(roundData.answer * rentingPrice / 100);

            await expect(userConnectedSubscription.rent(tokenId, {value: amountToSend + 10000}))
                .to.emit(connectedSubscription, "UpdateUser");
        });

        it("Should revert if no value is passed at renting", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixtureAndMint);

            const tokenId = 1;

            // Offer for rent

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            const minPrice = await connectedSubscription.minRentPrice();

            await connectedSubscription.offerForRent(tokenId,  minPrice * 5, 3600);

            // Get renting conditions

            const userConnectedSubscription = subscription.connect(otherAccounts[1]);

            await expect(userConnectedSubscription.rent(tokenId))
                .to.be.revertedWith("No value received");
        });

        it("Should revert when value sent is lower than allowed slippage", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixtureAndMint);

            const tokenId = 1;

            // Offer for rent

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            const minPrice = await connectedSubscription.minRentPrice();

            await connectedSubscription.offerForRent(tokenId,  minPrice * 5, 3600);

            // Get renting conditions

            const userConnectedSubscription = subscription.connect(otherAccounts[1]);

            const rentingConditions = await userConnectedSubscription.getRentingConditions(tokenId);

            // Compute ETH amount to send from subscription renting conditions

            const provider = ethers.getDefaultProvider("http://localhost:8545");

            const priceFeed = new ethers.Contract(chainlinkGoerliPriceFeedForEthUsdAddress, aggregatorV3InterfaceABI, provider);

            const roundData = await priceFeed.latestRoundData();

            const rentingPrice = rentingConditions.price

            const amountToSend = Math.floor(roundData.answer * rentingPrice / 100);

            await expect(userConnectedSubscription.rent(tokenId, {value: Math.floor(amountToSend / 2)}))
                .to.be.revertedWith("Too much slippage");
        });

        it("Should revert when value sent is higher than allowed slippage", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixtureAndMint);

            const tokenId = 1;

            // Offer for rent

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            const minPrice = await connectedSubscription.minRentPrice();

            await connectedSubscription.offerForRent(tokenId,  minPrice * 5, 3600);

            // Get renting conditions

            const userConnectedSubscription = subscription.connect(otherAccounts[1]);

            const rentingConditions = await userConnectedSubscription.getRentingConditions(tokenId);

            // Compute ETH amount to send from subscription renting conditions

            const provider = ethers.getDefaultProvider("http://localhost:8545");

            const priceFeed = new ethers.Contract(chainlinkGoerliPriceFeedForEthUsdAddress, aggregatorV3InterfaceABI, provider);

            const roundData = await priceFeed.latestRoundData();

            const rentingPrice = rentingConditions.price

            const amountToSend = Math.floor(roundData.answer * rentingPrice / 100);

            await expect(userConnectedSubscription.rent(tokenId, {value: amountToSend * 2}))
                .to.be.revertedWith("Too much slippage");
        });

        it("Should revert if subscription will expire before rent expires", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixtureAndMint);

            const tokenId = 1;

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            // Offer for rent

            const expirationTimestamp = await connectedSubscription.expiresAt(tokenId);

            const currentTimestamp = await time.latest();

            const duration = expirationTimestamp.sub(currentTimestamp).div(2);

            const minPrice = await connectedSubscription.minRentPrice();

            await connectedSubscription.offerForRent(tokenId,  minPrice * 5, duration);

            // Forward time
            time.increase(duration.add(3600));

            // Get renting conditions

            const userConnectedSubscription = subscription.connect(otherAccounts[1]);

            const rentingConditions = await userConnectedSubscription.getRentingConditions(tokenId);

            // Compute ETH amount to send from subscription renting conditions

            const provider = ethers.getDefaultProvider("http://localhost:8545");

            const priceFeed = new ethers.Contract(chainlinkGoerliPriceFeedForEthUsdAddress, aggregatorV3InterfaceABI, provider);

            const roundData = await priceFeed.latestRoundData();

            const rentingPrice = rentingConditions.price

            const amountToSend = Math.floor(roundData.answer * rentingPrice / 100);

            // Send transaction to rent token

            await expect(userConnectedSubscription.rent(tokenId, {value: amountToSend}))
                .to.be.revertedWith("Subscription expires before rent expires");
        });

        it("Should delete renting offer when a token is used", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixtureAndMint);

            const tokenId = 1;

            // Offer for rent

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            const minPrice = await connectedSubscription.minRentPrice();

            await connectedSubscription.offerForRent(tokenId,  minPrice * 5, 3600);

            // Get renting conditions

            const userConnectedSubscription = subscription.connect(otherAccounts[1]);

            const rentingConditions = await userConnectedSubscription.getRentingConditions(tokenId);

            // Compute ETH amount to send from subscription renting conditions

            const provider = ethers.getDefaultProvider("http://localhost:8545");

            const priceFeed = new ethers.Contract(chainlinkGoerliPriceFeedForEthUsdAddress, aggregatorV3InterfaceABI, provider);

            const roundData = await priceFeed.latestRoundData();

            const rentingPrice = rentingConditions.price

            const amountToSend = Math.floor(roundData.answer * rentingPrice / 100);

            // Send transaction to rent token

            await userConnectedSubscription.rent(tokenId, {value: amountToSend});

            const newRentingConditions = await userConnectedSubscription.getRentingConditions(tokenId);

            expect(newRentingConditions.createdAt).equal(0);
        });

        it("Should revert when trying to rent a token which is not proposed for rental", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixtureAndMint);

            const tokenId = 1;

            // Do NOT offer for rent

            const userConnectedSubscription = subscription.connect(otherAccounts[1]);

            await expect(userConnectedSubscription.rent(tokenId, {value: 42}))
                .to.be.revertedWith("Not available for renting");
        });

        it("Should revert when token owner tries to rent his own token", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixtureAndMint);

            const tokenId = 1;

            // Offer for rent

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            const minPrice = await connectedSubscription.minRentPrice();

            await connectedSubscription.offerForRent(tokenId,  minPrice * 5, 3600);

            // Get renting conditions

            const rentingConditions = await connectedSubscription.getRentingConditions(tokenId);

            // Compute ETH amount to send from subscription renting conditions

            const provider = ethers.getDefaultProvider("http://localhost:8545");

            const priceFeed = new ethers.Contract(chainlinkGoerliPriceFeedForEthUsdAddress, aggregatorV3InterfaceABI, provider);

            const roundData = await priceFeed.latestRoundData();

            const rentingPrice = rentingConditions.price

            const amountToSend = Math.floor(roundData.answer * rentingPrice / 100);

            // Send transaction to rent token

            const currentUserOfMintedToken = await connectedSubscription.userOf(tokenId);

            expect(currentUserOfMintedToken).to.equal(ethers.constants.AddressZero);

            await expect(connectedSubscription.rent(tokenId, {value: amountToSend}))
                .to.be.revertedWith("Cannot use your own token");
        });

        it("Should update balances when a token is rented", async () => {
            const {subscription, netflix, marketplace, otherAccounts} = await loadFixture(deploySubscriptionFixtureAndMint);

            const tokenId = 1;

            // Offer for rent

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            const minPrice = await connectedSubscription.minRentPrice();

            const askingPrice = minPrice * 5;

            await connectedSubscription.offerForRent(tokenId,  askingPrice, 3600);

            // Get renting conditions

            const userConnectedSubscription = subscription.connect(otherAccounts[1]);

            const rentingConditions = await userConnectedSubscription.getRentingConditions(tokenId);

            // Compute ETH amount to send from subscription renting conditions

            const provider = ethers.getDefaultProvider("http://localhost:8545");

            const priceFeed = new ethers.Contract(chainlinkGoerliPriceFeedForEthUsdAddress, aggregatorV3InterfaceABI, provider);

            const roundData = await priceFeed.latestRoundData();

            const rentingPrice = rentingConditions.price

            const amountToSend = Math.floor(roundData.answer * rentingPrice / 100);

            // Check balances before renting

            const netflixBalanceBeforeRenting = await subscription.balances(netflix.address);
            const marketplaceBalanceBeforeRenting = await subscription.balances(marketplace.address);
            const tokenOnwerBalanceBeforeRenting = await subscription.balances(otherAccounts[0].address);

            // Send transaction to rent token

            await userConnectedSubscription.rent(tokenId, {value: amountToSend});

            // Check balances after renting

            const netflixCommission = Math.floor(amountToSend * 0.15);
            const marketplaceCommission = Math.floor(amountToSend * 0.15);
            const tokenOwnerRevenue = amountToSend - netflixCommission - marketplaceCommission;

            const netflixBalanceAfterRenting = await subscription.balances(netflix.address);
            const marketplaceBalanceAfterRenting = await subscription.balances(marketplace.address);
            const tokenOnwerBalanceAfterRenting = await subscription.balances(otherAccounts[0].address);

            expect(netflixBalanceAfterRenting).equal(netflixBalanceBeforeRenting.add(netflixCommission));
            expect(marketplaceBalanceAfterRenting).equal(marketplaceBalanceBeforeRenting.add(marketplaceCommission));
            expect(tokenOnwerBalanceAfterRenting).equal(tokenOnwerBalanceBeforeRenting.add(tokenOwnerRevenue));
        });

        /** RECLAIMING **/

        it("Should emit event when a token is reclaimed by its owner", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixtureAndMint);

            const tokenId = 1;

            const rentDuration = 3600;

            // Offer for rent

            const tokenOwnerConnectedSubscription = subscription.connect(otherAccounts[0]);

            const minPrice = await tokenOwnerConnectedSubscription.minRentPrice();

            await tokenOwnerConnectedSubscription.offerForRent(tokenId,  minPrice * 5, 3600);

            // Get renting conditions

            const userConnectedSubscription = subscription.connect(otherAccounts[1]);

            const rentingConditions = await userConnectedSubscription.getRentingConditions(tokenId);

            // Compute ETH amount to send from subscription renting conditions

            const provider = ethers.getDefaultProvider("http://localhost:8545");

            const priceFeed = new ethers.Contract(chainlinkGoerliPriceFeedForEthUsdAddress, aggregatorV3InterfaceABI, provider);

            const roundData = await priceFeed.latestRoundData();

            const rentingPrice = rentingConditions.price

            const amountToSend = Math.floor(roundData.answer * rentingPrice / 100);

            // Send transaction to rent token

            await userConnectedSubscription.rent(tokenId, {value: amountToSend});

            // Move forward in time

            await time.increaseTo(await time.latest() + rentDuration + 100);

            // Reclaim token

            await expect(tokenOwnerConnectedSubscription.reclaim(tokenId))
                .to.emit(tokenOwnerConnectedSubscription, "UpdateUser")
                .withArgs(tokenId, ethers.constants.AddressZero, 0);

            const tokenUser = await tokenOwnerConnectedSubscription.userOf(tokenId);

            expect(tokenUser).to.equal(ethers.constants.AddressZero);
        });

        it("Should revert if token owner tries to reclaim its token while it's used", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixtureAndMint);

            const tokenId = 1;

            const rentDuration = 3600;

            // Offer for rent

            const tokenOwnerConnectedSubscription = subscription.connect(otherAccounts[0]);

            const minPrice = await tokenOwnerConnectedSubscription.minRentPrice();

            await tokenOwnerConnectedSubscription.offerForRent(tokenId,  minPrice * 5, 3600);

            // Get renting conditions

            const userConnectedSubscription = subscription.connect(otherAccounts[1]);

            const rentingConditions = await userConnectedSubscription.getRentingConditions(tokenId);

            // Compute ETH amount to send from subscription renting conditions

            const provider = ethers.getDefaultProvider("http://localhost:8545");

            const priceFeed = new ethers.Contract(chainlinkGoerliPriceFeedForEthUsdAddress, aggregatorV3InterfaceABI, provider);

            const roundData = await priceFeed.latestRoundData();

            const rentingPrice = rentingConditions.price

            const amountToSend = Math.floor(roundData.answer * rentingPrice / 100);

            // Send transaction to rent token

            await userConnectedSubscription.rent(tokenId, {value: amountToSend});

            // Move forward in time but before rental expiration

            await time.increaseTo(await time.latest() + rentDuration - 100);

            // Try to reclaim token

            await expect(tokenOwnerConnectedSubscription.reclaim(tokenId))
                .to.be.revertedWith("Already used");
        });

        it("Should revert if address trying to reclaim a token is not the token owner", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixtureAndMint);

            const tokenId = 1;

            const rentDuration = 3600;

            // Offer for rent

            const tokenOwnerConnectedSubscription = subscription.connect(otherAccounts[0]);

            const minPrice = await tokenOwnerConnectedSubscription.minRentPrice();

            await tokenOwnerConnectedSubscription.offerForRent(tokenId,  minPrice * 5, 3600);

            // Get renting conditions

            const userConnectedSubscription = subscription.connect(otherAccounts[1]);

            const rentingConditions = await userConnectedSubscription.getRentingConditions(tokenId);

            // Compute ETH amount to send from subscription renting conditions

            const provider = ethers.getDefaultProvider("http://localhost:8545");

            const priceFeed = new ethers.Contract(chainlinkGoerliPriceFeedForEthUsdAddress, aggregatorV3InterfaceABI, provider);

            const roundData = await priceFeed.latestRoundData();

            const rentingPrice = rentingConditions.price

            const amountToSend = Math.floor(roundData.answer * rentingPrice / 100);

            // Send transaction to rent token

            await userConnectedSubscription.rent(tokenId, {value: amountToSend});

            // Move forward in time

            await time.increaseTo(await time.latest() + rentDuration + 100);

            // Try to reclaim token

            const notApprovedConnectedSubscription = subscription.connect(otherAccounts[2]);

            await expect(notApprovedConnectedSubscription.reclaim(tokenId))
                .to.be.revertedWith("Caller is not token owner or approved");
        });

        /** 4907 ENUMERATIONS **/

        it("Should add token id to user's enumeration when token is rented", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixtureAndMint);

            const tokenId = 1;

            // Offer for rent

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            const minPrice = await connectedSubscription.minRentPrice();

            await connectedSubscription.offerForRent(tokenId,  minPrice * 5, 3600);

            // Get renting conditions

            const userConnectedSubscription = subscription.connect(otherAccounts[1]);

            const rentingConditions = await userConnectedSubscription.getRentingConditions(tokenId);

            // Compute ETH amount to send from subscription renting conditions

            const provider = ethers.getDefaultProvider("http://localhost:8545");

            const priceFeed = new ethers.Contract(chainlinkGoerliPriceFeedForEthUsdAddress, aggregatorV3InterfaceABI, provider);

            const roundData = await priceFeed.latestRoundData();

            const rentingPrice = rentingConditions.price

            const amountToSend = Math.floor(roundData.answer * rentingPrice / 100);

            // Send transaction to rent token

            await userConnectedSubscription.rent(tokenId, {value: amountToSend})

            // Check balance

            const balanceOfNewUser = await connectedSubscription.usedBalanceOf(otherAccounts[1].address);

            const token = await connectedSubscription.tokenOfUserByIndex(otherAccounts[1].address, balanceOfNewUser.sub(1));

            expect(token).to.equal(tokenId);
        });

        it("Should add multiples tokens for each account", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixtureAndMintMultipleAndSetUsers);

            const mappingAddressToTokenIds = {
                [otherAccounts[1].address]: [1,2,3,4,5],
                [otherAccounts[2].address]: [6,7,8,9,10],
                [otherAccounts[3].address]: [11,12,13,14,15],
                [otherAccounts[4].address]: [16,17,18,19,20]
            };

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            // Read usedBalances of each address

            const usedBalances: {[key: string]: BigNumber} = {};

            for (let i = 1; i <= 4; i++) {
                const usedBalance = await connectedSubscription.usedBalanceOf(otherAccounts[i].address)

                expect(usedBalance).to.equal(5);

                usedBalances[otherAccounts[i].address] = usedBalance;
            }

            // Enumerate tokens of each address

            for (const [address, balance] of Object.entries(usedBalances)) {

                for (let i = 0; i < balance.toBigInt(); i++) {
                    const tokenId = await connectedSubscription.tokenOfUserByIndex(address, i);

                    expect(tokenId).to.equal(mappingAddressToTokenIds[address][i]);
                }
            }
        });

        it("Should revert if reading a token at out of bounds index in user enumeration", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixtureAndMintMultipleAndSetUsers);

            const connectedSubscription = await subscription.connect(otherAccounts[0]);

            expect(connectedSubscription.tokenOfUserByIndex(otherAccounts[1].address, 5))
                .to.be.revertedWith("ERC4907Enumerable: user index out of bounds");
        });

        it("Should properly update user enumeration when first token of his enumeration gets reclaimed", async () => {
            const {subscription, otherAccounts, expires} = await loadFixture(deploySubscriptionFixtureAndMintMultipleAndSetUsers);

            await time.increaseTo(expires + 30)

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            await connectedSubscription.reclaim(1);

            const userBalance = await connectedSubscription.usedBalanceOf(otherAccounts[1].address);

            expect(userBalance).to.equal(4);

            expect(await connectedSubscription.tokenOfUserByIndex(otherAccounts[1].address, 0)).to.equal(5);
            expect(await connectedSubscription.tokenOfUserByIndex(otherAccounts[1].address, 1)).to.equal(2);
            expect(await connectedSubscription.tokenOfUserByIndex(otherAccounts[1].address, 2)).to.equal(3);
            expect(await connectedSubscription.tokenOfUserByIndex(otherAccounts[1].address, 3)).to.equal(4);

            expect(connectedSubscription.tokenOfUserByIndex(otherAccounts[1].address, 4))
                .to.be.revertedWith("ERC4907Enumerable: user index out of bounds");
        });

        it("Should properly update user enumeration when last token of his enumeration gets reclaimed", async () => {
            const {subscription, otherAccounts, expires} = await loadFixture(deploySubscriptionFixtureAndMintMultipleAndSetUsers);

            await time.increaseTo(expires + 30)

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            await connectedSubscription.reclaim(5);

            const userBalance = await connectedSubscription.usedBalanceOf(otherAccounts[1].address);

            expect(userBalance).to.equal(4);

            expect(await connectedSubscription.tokenOfUserByIndex(otherAccounts[1].address, 0)).to.equal(1);
            expect(await connectedSubscription.tokenOfUserByIndex(otherAccounts[1].address, 1)).to.equal(2);
            expect(await connectedSubscription.tokenOfUserByIndex(otherAccounts[1].address, 2)).to.equal(3);
            expect(await connectedSubscription.tokenOfUserByIndex(otherAccounts[1].address, 3)).to.equal(4);

            expect(connectedSubscription.tokenOfUserByIndex(otherAccounts[1].address, 4))
                .to.be.revertedWith("ERC4907Enumerable: user index out of bounds");
        });

        it("Should properly update user enumeration when intermediate token of his enumeration gets reclaimed", async () => {
            const {subscription, otherAccounts, expires} = await loadFixture(deploySubscriptionFixtureAndMintMultipleAndSetUsers);

            await time.increaseTo(expires + 30)

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            await connectedSubscription.reclaim(3);

            const userBalance = await connectedSubscription.usedBalanceOf(otherAccounts[1].address);

            expect(userBalance).to.equal(4);

            expect(await connectedSubscription.tokenOfUserByIndex(otherAccounts[1].address, 0)).to.equal(1);
            expect(await connectedSubscription.tokenOfUserByIndex(otherAccounts[1].address, 1)).to.equal(2);
            expect(await connectedSubscription.tokenOfUserByIndex(otherAccounts[1].address, 2)).to.equal(5);
            expect(await connectedSubscription.tokenOfUserByIndex(otherAccounts[1].address, 3)).to.equal(4);

            expect(connectedSubscription.tokenOfUserByIndex(otherAccounts[1].address, 4))
                .to.be.revertedWith("ERC4907Enumerable: user index out of bounds");
        });

        it("Should properly update user enumeration even if all tokens of his enumeration have been reclaimed", async () => {
            const {subscription, otherAccounts, expires} = await loadFixture(deploySubscriptionFixtureAndMintMultipleAndSetUsers);

            await time.increaseTo(expires + 30)

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            await connectedSubscription.reclaim(1);
            await connectedSubscription.reclaim(2);
            await connectedSubscription.reclaim(3);
            await connectedSubscription.reclaim(4);
            await connectedSubscription.reclaim(5);

            const userBalance = await connectedSubscription.usedBalanceOf(otherAccounts[1].address);

            expect(userBalance).to.equal(0);

            expect(connectedSubscription.tokenOfUserByIndex(otherAccounts[1].address, 0))
                .to.be.revertedWith("ERC4907Enumerable: user index out of bounds");
        });

        /** MARKETPLACE ENUMERATIONS **/

        it("Should add token id to marketplace enumeration when rental offer is created", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixture);

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            // Mint

            const provider = ethers.getDefaultProvider("http://localhost:8545");

            const priceFeed = new ethers.Contract(chainlinkGoerliPriceFeedForEthUsdAddress, aggregatorV3InterfaceABI, provider);

            const roundData = await priceFeed.latestRoundData();

            const contentSubscriptionPrice = await connectedSubscription.contentSubscriptionPrice();

            const amountToSend = Math.floor(roundData.answer * contentSubscriptionPrice / 100);

            await connectedSubscription.mint({value: amountToSend});

            const tokenId = 1;

            // Create rental offer

            const minPrice = await connectedSubscription.minRentPrice();
            const minDuration = await connectedSubscription.minRentDuration();

            const availableTokenCountBeforeOfferCreation = await connectedSubscription.getAvailableTokenCount();

            expect(availableTokenCountBeforeOfferCreation).to.equal(0);

            await connectedSubscription.offerForRent(tokenId,  minPrice * 5, minDuration * 2);

            const availableTokenCountAfterOfferCreation = await connectedSubscription.getAvailableTokenCount();
            const availableTokenId = await connectedSubscription.getAvailableTokenIdAtIndex(availableTokenCountAfterOfferCreation.sub(1));

            expect(availableTokenCountAfterOfferCreation).to.equal(1);
            expect(availableTokenId).to.equal(tokenId);
        });

        it("Should add multiple token ids to marketplace enumeration when rental offers are created", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixture);

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            // Mint multiple tokens

            const provider = ethers.getDefaultProvider("http://localhost:8545");

            const priceFeed = new ethers.Contract(chainlinkGoerliPriceFeedForEthUsdAddress, aggregatorV3InterfaceABI, provider);

            const roundData = await priceFeed.latestRoundData();

            const contentSubscriptionPrice = await connectedSubscription.contentSubscriptionPrice();

            const amountToSendForMint = Math.floor(roundData.answer * contentSubscriptionPrice / 100);

            const tokenIds = [...Array(20).keys()].map(item => item+1);

            for (let i = 0; i < tokenIds.length; i++) {
                await connectedSubscription.mint({value: amountToSendForMint});
            }

            // Create multiple rental offers

            const minPrice = await connectedSubscription.minRentPrice();
            const minDuration = await connectedSubscription.minRentDuration();

            const availableTokenCountBeforeOfferCreation = await connectedSubscription.getAvailableTokenCount();

            expect(availableTokenCountBeforeOfferCreation).to.equal(0);

            await connectedSubscription.offerForRent(tokenIds[0],  minPrice * 5, minDuration * 2);
            await connectedSubscription.offerForRent(tokenIds[1],  minPrice * 5, minDuration * 2);
            await connectedSubscription.offerForRent(tokenIds[2],  minPrice * 5, minDuration * 2);
            await connectedSubscription.offerForRent(tokenIds[3],  minPrice * 5, minDuration * 2);
            await connectedSubscription.offerForRent(tokenIds[4],  minPrice * 5, minDuration * 2);

            // Check enumerables

            const availableTokenCountAfterOfferCreation = await connectedSubscription.getAvailableTokenCount();
            const availableTokenIdAtIndex0 = await connectedSubscription.getAvailableTokenIdAtIndex(0);
            const availableTokenIdAtIndex1 = await connectedSubscription.getAvailableTokenIdAtIndex(1);
            const availableTokenIdAtIndex2 = await connectedSubscription.getAvailableTokenIdAtIndex(2);
            const availableTokenIdAtIndex3 = await connectedSubscription.getAvailableTokenIdAtIndex(3);
            const availableTokenIdAtIndex4 = await connectedSubscription.getAvailableTokenIdAtIndex(4);

            expect(availableTokenCountAfterOfferCreation).to.equal(5);
            expect(availableTokenIdAtIndex0).to.equal(tokenIds[0]);
            expect(availableTokenIdAtIndex1).to.equal(tokenIds[1]);
            expect(availableTokenIdAtIndex2).to.equal(tokenIds[2]);
            expect(availableTokenIdAtIndex3).to.equal(tokenIds[3]);
            expect(availableTokenIdAtIndex4).to.equal(tokenIds[4]);
        });

        it("Should remove token id from marketplace enumeration when a token is rented", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixture);

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            // Mint multiple tokens

            const provider = ethers.getDefaultProvider("http://localhost:8545");

            const priceFeed = new ethers.Contract(chainlinkGoerliPriceFeedForEthUsdAddress, aggregatorV3InterfaceABI, provider);

            const roundData = await priceFeed.latestRoundData();

            const contentSubscriptionPrice = await connectedSubscription.contentSubscriptionPrice();

            const amountToSendForMint = Math.floor(roundData.answer * contentSubscriptionPrice / 100);

            const tokenIds = [...Array(20).keys()].map(item => item+1);

            for (let i = 0; i < tokenIds.length; i++) {
                await connectedSubscription.mint({value: amountToSendForMint});
            }

            // Create multiple rental offers

            const minPrice = await connectedSubscription.minRentPrice();
            const minDuration = await connectedSubscription.minRentDuration();

            const rentalPrice = minPrice * 5;

            const availableTokenCountBeforeOfferCreation = await connectedSubscription.getAvailableTokenCount();

            expect(availableTokenCountBeforeOfferCreation).to.equal(0);

            await connectedSubscription.offerForRent(tokenIds[0], rentalPrice, minDuration * 2);
            await connectedSubscription.offerForRent(tokenIds[1], rentalPrice, minDuration * 2);
            await connectedSubscription.offerForRent(tokenIds[2], rentalPrice, minDuration * 2);
            await connectedSubscription.offerForRent(tokenIds[3], rentalPrice, minDuration * 2);
            await connectedSubscription.offerForRent(tokenIds[4], rentalPrice, minDuration * 2);

            // Rent a token

            const amountToSendForRental = Math.floor(roundData.answer * rentalPrice / 100);

            const userConnectedSubscription = subscription.connect(otherAccounts[1]);

            await userConnectedSubscription.rent(tokenIds[2], {value: amountToSendForRental});

            // Check enumerables

            const availableTokenCountAfterFirstRenting = await connectedSubscription.getAvailableTokenCount();
            const availableTokenIdAtIndex0 = await connectedSubscription.getAvailableTokenIdAtIndex(0);
            const availableTokenIdAtIndex1 = await connectedSubscription.getAvailableTokenIdAtIndex(1);
            const availableTokenIdAtIndex2 = await connectedSubscription.getAvailableTokenIdAtIndex(2);
            const availableTokenIdAtIndex3 = await connectedSubscription.getAvailableTokenIdAtIndex(3);

            await expect(connectedSubscription.getAvailableTokenIdAtIndex(4))
                .to.be.reverted;

            expect(availableTokenCountAfterFirstRenting).to.equal(4);

            expect(availableTokenIdAtIndex0).to.equal(tokenIds[0]);
            expect(availableTokenIdAtIndex1).to.equal(tokenIds[1]);
            expect(availableTokenIdAtIndex2).to.equal(tokenIds[4]);
            expect(availableTokenIdAtIndex3).to.equal(tokenIds[3]);

            // Rent other tokens

            await userConnectedSubscription.rent(tokenIds[0], {value: amountToSendForRental});
            await userConnectedSubscription.rent(tokenIds[1], {value: amountToSendForRental});
            await userConnectedSubscription.rent(tokenIds[3], {value: amountToSendForRental});
            await userConnectedSubscription.rent(tokenIds[4], {value: amountToSendForRental});

            // Check enumerables

            const availableTokenCountAfterOtherTokensRenting = await connectedSubscription.getAvailableTokenCount();

            await expect(connectedSubscription.getAvailableTokenIdAtIndex(0))
                .to.be.reverted;

            expect(availableTokenCountAfterOtherTokensRenting).to.equal(0);
        })
    });
});
