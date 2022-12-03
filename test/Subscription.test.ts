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

        const subscription = await upgrades.deployProxy(
            Subscription,
            ["Fakeflix", "FLX", 1549, 100, netflix.address, marketplace.address, chainlinkGoerliPriceFeedForEthUsdAddress],
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

            await expect(connectedSubscription.mint({value: amountToSend / 2}))
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

            const amountToSend = Math.floor(roundData.answer * contentSubscriptionPrice / 100);

            const tokenIds = [...Array(20).keys()].map(item => item+1);

            for (let i = 0; i < tokenIds.length; i++) {
                await connectedSubscription.mint({value: amountToSend});
            }

            const currentTimestamp = await time.latest();

            const expires = currentTimestamp + 2000;

            let i: number = 0;

            // Add 5 tokens to each address

            for (i; i < 5; i++) {
                await connectedSubscription.setUser(tokenIds[i], otherAccounts[1].address, expires);
            }

            for (i; i < 10; i++) {
                await connectedSubscription.setUser(tokenIds[i], otherAccounts[2].address, expires);
            }

            for (i; i < 15; i++) {
                await connectedSubscription.setUser(tokenIds[i], otherAccounts[3].address, expires);
            }

            for (i; i < 20; i++) {
                await connectedSubscription.setUser(tokenIds[i], otherAccounts[4].address, expires);
            }

            return {subscription, owner, netflix, marketplace, otherAccounts, expires};
        }

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

        it("Should revert when minimal renting price is not reached by msg.value", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixtureAndMint);

            const tokenId = 1;

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            const minPrice = await connectedSubscription.minRentPrice();

            await expect(connectedSubscription.offerForRent(tokenId,  minPrice - 1,3600))
                .to.be.revertedWith("Price too low");
        });

        //TODO when setUser fully tested
        it("Should revert when token is already used", async () => {

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
        })

        it("Should set user", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixtureAndMint);

            const tokenId = 1;

            const currentTimestamp = await time.latest();

            const expires = currentTimestamp + 20; // 20 seconds more

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            const currentUserOfMintedToken = await connectedSubscription.userOf(tokenId);

            expect(currentUserOfMintedToken).to.equal(ethers.constants.AddressZero);

            await expect(connectedSubscription.setUser(tokenId, otherAccounts[1].address, expires))
                .to.emit(connectedSubscription, "UpdateUser")
                .withArgs(tokenId, otherAccounts[1].address, expires);

            const newUserOfMintedToken = await connectedSubscription.userOf(tokenId);

            expect(newUserOfMintedToken).to.equal(otherAccounts[1].address);

            const usedBalanceOfNewUser = await connectedSubscription.usedBalanceOf(otherAccounts[1].address);

            expect(usedBalanceOfNewUser).to.equal(1);

            const expirationTime = await connectedSubscription.userExpires(tokenId);

            expect(expirationTime).to.equal(expires);
        });

        it("Should set user from approved account", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixtureAndMint);

            const tokenId = 1;

            const currentTimestamp = await time.latest();

            const expires = currentTimestamp + 20; // 20 seconds more

            const tokenOwnerConnectedSubscription = subscription.connect(otherAccounts[0]);

            await tokenOwnerConnectedSubscription.approve(otherAccounts[2].address, tokenId);

            const approvedConnectedSubscription = subscription.connect(otherAccounts[2]);

            await expect(approvedConnectedSubscription.setUser(tokenId, otherAccounts[1].address, expires))
                .to.emit(approvedConnectedSubscription, "UpdateUser")
                .withArgs(tokenId, otherAccounts[1].address, expires);
        });

        it("Should revert if account is neither token owner nor approved", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixtureAndMint);

            const tokenId = 1;

            const currentTimestamp = await time.latest();

            const expires = currentTimestamp + 20; // 20 seconds more

            const notApprovedConnectedSubscription = subscription.connect(otherAccounts[2]);

            await expect(notApprovedConnectedSubscription.setUser(tokenId, otherAccounts[1].address, expires))
                .to.be.revertedWith("ERC4907: transfer caller is not owner nor approved");
        });

        it("Should set user to 0 after owner reclaims his token", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixtureAndMint);

            const tokenId = 1;

            const currentTimestamp = await time.latest();

            const expires = currentTimestamp + (3600 * 24 * 7); // 1 week of renting

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            await connectedSubscription.setUser(tokenId, otherAccounts[1].address, expires);

            await time.increaseTo(expires + 30);

            await connectedSubscription.setUser(tokenId, ethers.constants.AddressZero, 42);

            const usedBalanceOfPreviousUser = await connectedSubscription.usedBalanceOf(otherAccounts[1].address);

            expect(usedBalanceOfPreviousUser).to.equal(0);

            const newUserOfMintedToken = await connectedSubscription.userOf(tokenId);

            expect(newUserOfMintedToken).to.equal(ethers.constants.AddressZero);

            const expirationTime = await connectedSubscription.userExpires(tokenId);

            expect(expirationTime).to.equal(0);
        });

        it("Should revert if expiration timestamp has passed", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixtureAndMint);

            const tokenId = 1;

            const currentTimestamp = await time.latest();

            const expires = currentTimestamp - 20; // 20 seconds less

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            await expect(connectedSubscription.setUser(tokenId, otherAccounts[1].address, expires))
                .to.be.revertedWith("Expired timestamp");
        });

        it("Should revert if token's owner tries to become user of his token", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixtureAndMint);

            const tokenId = 1;

            const currentTimestamp = await time.latest();

            const expires = currentTimestamp + 200;

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            await expect(connectedSubscription.setUser(tokenId, otherAccounts[0].address, expires))
                .to.be.revertedWith("Cannot use your own token");
        });

        it("Should revert if token is already used", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixtureAndMint);

            const tokenId = 1;

            const currentTimestamp = await time.latest();

            const expires = currentTimestamp + 2000;

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            await connectedSubscription.setUser(tokenId, otherAccounts[1].address, expires);

            await expect(connectedSubscription.setUser(tokenId, otherAccounts[2].address, expires + 200))
                .to.be.revertedWith("Already used");
        });

        it("Should revert if token does not exist", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixtureAndMint);

            const tokenId = 2;

            const currentTimestamp = await time.latest();

            const expires = currentTimestamp + 2000;

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            await expect(connectedSubscription.setUser(tokenId, otherAccounts[1].address, expires))
                .to.be.revertedWith("ERC721: invalid token ID");
        });

        it("Should add token id to user's enumeration", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixtureAndMint);

            const tokenId = 1;

            const currentTimestamp = await time.latest();

            const expires = currentTimestamp + 2000;

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            await connectedSubscription.setUser(tokenId, otherAccounts[1].address, expires);

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

            await connectedSubscription.setUser(1, ethers.constants.AddressZero, 0);

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

            await connectedSubscription.setUser(5, ethers.constants.AddressZero, 0);

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

            await connectedSubscription.setUser(3, ethers.constants.AddressZero, 0);

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

            await connectedSubscription.setUser(1, ethers.constants.AddressZero, 0);
            await connectedSubscription.setUser(2, ethers.constants.AddressZero, 0);
            await connectedSubscription.setUser(3, ethers.constants.AddressZero, 0);
            await connectedSubscription.setUser(4, ethers.constants.AddressZero, 0);
            await connectedSubscription.setUser(5, ethers.constants.AddressZero, 0);

            const userBalance = await connectedSubscription.usedBalanceOf(otherAccounts[1].address);

            expect(userBalance).to.equal(0);

            expect(connectedSubscription.tokenOfUserByIndex(otherAccounts[1].address, 0))
                .to.be.revertedWith("ERC4907Enumerable: user index out of bounds");
        });

    });
});
