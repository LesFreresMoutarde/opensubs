import {ethers, upgrades} from "hardhat";
import { expect } from "chai";
import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import {Subscription} from "../typechain-types";

describe("Subscription smart contract test", () => {
    async function deploySubscriptionFixture() {
        const Subscription = await ethers.getContractFactory("Subscription");

        const subscription = await upgrades.deployProxy(
            Subscription,
            ["Fakeflix", "FLX"],
            { initializer: 'initialize', kind: 'transparent'}
        ) as Subscription;

        await subscription.deployed();

        const [owner, ...otherAccounts] = await ethers.getSigners();

        return {subscription, owner, otherAccounts};
    }

    // TODO MINT WITH ETH VALUE ONLY
    describe("Mint", async () => {
        it("Should mint a token", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixture);

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            await expect(connectedSubscription.mint())
                .to.emit(connectedSubscription, "Transfer")
                .withArgs(ethers.constants.AddressZero, otherAccounts[0].address, 1);

            await expect(connectedSubscription.mint())
                .to.emit(connectedSubscription, "Transfer")
                .withArgs(ethers.constants.AddressZero, otherAccounts[0].address, 2);
        });
    });

    describe("Renting", async () => {
        async function deploySubscriptionFixtureAndMint() {
            const {subscription, owner, otherAccounts} = await loadFixture(deploySubscriptionFixture);

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            await connectedSubscription.mint();

            return {subscription, owner, otherAccounts};
        }

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

        it("Should set user to 0 after owner reclaims his token", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixtureAndMint);

            const tokenId = 1;

            const currentTimestamp = await time.latest();

            const expires = currentTimestamp + (3600 * 24 * 7); // 1 week of renting

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            await connectedSubscription.setUser(tokenId, otherAccounts[1].address, expires);

            await time.increase(expires + 15);

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
        })

        it("Should revert if token is already used", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixtureAndMint);

            const tokenId = 1;

            const currentTimestamp = await time.latest();

            const expires = currentTimestamp + 2000;

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            await connectedSubscription.setUser(tokenId, otherAccounts[1].address, expires);

            await expect(connectedSubscription.setUser(tokenId, otherAccounts[2].address, expires + 200))
                .to.be.revertedWith("Already used");
        })
    });
});
