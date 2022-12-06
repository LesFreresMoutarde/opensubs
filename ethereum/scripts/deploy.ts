import {ethers, upgrades} from "hardhat";
import {Subscription} from "../typechain-types";
import {ContractFactory} from "ethers";

const chainlinkGoerliPriceFeedForEthUsdAddress: string = "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e";

async function deployFakeflix(
    Subscription: ContractFactory,
    fakeflixAccountAddress: string,
    marketplaceAccountAddress: string
): Promise<Subscription> {
    const fakeflixContentSubscriptionPrice = 1549; // $15,49
    const fakeflixMinRentPrice = 100; // $1
    const fakeflixMinRentDuration = 60; // 1 minute

    const fakeflix = await upgrades.deployProxy(
        Subscription,
        [
            "Fakeflix",
            "FLX",
            fakeflixContentSubscriptionPrice,
            fakeflixMinRentPrice,
            fakeflixMinRentDuration,
            fakeflixAccountAddress,
            marketplaceAccountAddress,
            chainlinkGoerliPriceFeedForEthUsdAddress,
        ],
        {initializer: "initialize", kind: "transparent"}
    ) as Subscription;

    await fakeflix.deployed();

    return fakeflix;
}

async function deploySpooftify(
    Subscription: ContractFactory,
    spooftifyAccountAddress: string,
    marketplaceAccountAddress: string
): Promise<Subscription> {
    const spooftifyContentSubscriptionPrice = 999; // $9,99
    const spooftifyMinRentPrice = 100; // $1
    const spooftifyMinRentDuration = 60; // 1 minute

    const spooftify = await upgrades.deployProxy(
        Subscription,
        [
            "Spooftify",
            "SPF",
            spooftifyContentSubscriptionPrice,
            spooftifyMinRentPrice,
            spooftifyMinRentDuration,
            spooftifyAccountAddress,
            marketplaceAccountAddress,
            chainlinkGoerliPriceFeedForEthUsdAddress,
        ],
        {initializer: "initialize", kind: "transparent"}
    ) as Subscription;

    await spooftify.deployed();

    return spooftify;
}

async function main() {
    const Subscription = await ethers.getContractFactory("Subscription");

    const [
        fakeflixAccount,
        spooftifyAccount,
        marketplaceAccount,
        // ...accounts
    ] = await ethers.getSigners();

    const fakeflix = await deployFakeflix(Subscription, fakeflixAccount.address, marketplaceAccount.address);

    console.log(`Fakeflix deployed to ${fakeflix.address}`);

    const spooftify = await deploySpooftify(Subscription, spooftifyAccount.address, marketplaceAccount.address);

    console.log(`Spooftify deployed to ${spooftify.address}`);
}

main().catch(e => {
    console.error(e);
    process.exitCode = 1;
});
