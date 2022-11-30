import {ethers, upgrades} from "hardhat";
import { expect } from "chai";
import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
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
                .withArgs(ethers.constants.AddressZero, otherAccounts[0].address, 0);

            await expect(connectedSubscription.mint())
                .to.emit(connectedSubscription, "Transfer")
                .withArgs(ethers.constants.AddressZero, otherAccounts[0].address, 1);
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

            const tokenId = 0;

            const currentTimestamp = Math.floor(Date.now() / 1000);
            const expires = currentTimestamp + 20; // 20 seconds more

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            await expect(connectedSubscription.setUser(tokenId, otherAccounts[1].address, expires))
                .to.emit(connectedSubscription, "UpdateUser")
                .withArgs(tokenId, otherAccounts[1].address, expires);
        });

        it("Should revert if expiration timestamp has passed", async () => {
            const {subscription, otherAccounts} = await loadFixture(deploySubscriptionFixtureAndMint);

            const tokenId = 0;

            const currentTimestamp = Math.floor(Date.now() / 1000);
            const expires = currentTimestamp - 20; // 20 seconds less

            const connectedSubscription = subscription.connect(otherAccounts[0]);

            await expect(connectedSubscription.setUser(tokenId, otherAccounts[1].address, expires))
                .to.be.revertedWith("Expired timestamp");
        });
    });
});
