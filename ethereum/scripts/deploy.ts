import {ethers, upgrades} from "hardhat";
import {Subscription} from "../typechain-types";
import {BigNumber, ContractFactory} from "ethers";

const chainlinkGoerliPriceFeedForEthUsdAddress: string = "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e";

async function deployFakeflix(
    Subscription: ContractFactory,
    fakeflixAccountAddress: string,
    marketplaceAccountAddress: string
): Promise<Subscription> {
    const fakeflixContentSubscriptionPrice = 1549; // $15,49
    const fakeflixMinRentPrice = 100; // $1
    const fakeflixMinRentDuration = 120; // 2 minutes
    const fakeFlixContentSubscriptionDuration = 30 * 24 * 60 * 60; // 1 month
    const fakeFlixBaseUri = 'https://firebasestorage.googleapis.com/v0/b/alyra-certification.appspot.com/o/metadata%2Ffakeflix%2F/'

    const fakeflix = await upgrades.deployProxy(
        Subscription,
        [
            "Fakeflix",
            "FLX",
            fakeflixContentSubscriptionPrice,
            fakeFlixContentSubscriptionDuration,
            fakeflixMinRentPrice,
            fakeflixMinRentDuration,
            fakeflixAccountAddress,
            marketplaceAccountAddress,
            chainlinkGoerliPriceFeedForEthUsdAddress,
            fakeFlixBaseUri
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
    const spooftifyMinRentDuration = 120; // 2 minutes
    const spooftifyContentSubscriptionDuration = 30 * 24 * 60 * 60; // 1 month
    const spooftifyBaseUri = 'https://firebasestorage.googleapis.com/v0/b/alyra-certification.appspot.com/o/metadata%2Fspooftify%2F';

    const spooftify = await upgrades.deployProxy(
        Subscription,
        [
            "Spooftify",
            "SPF",
            spooftifyContentSubscriptionPrice,
            spooftifyContentSubscriptionDuration,
            spooftifyMinRentPrice,
            spooftifyMinRentDuration,
            spooftifyAccountAddress,
            marketplaceAccountAddress,
            chainlinkGoerliPriceFeedForEthUsdAddress,
            spooftifyBaseUri
        ],
        {initializer: "initialize", kind: "transparent"}
    ) as Subscription;

    await spooftify.deployed();

    return spooftify;
}

async function main() {
    const Subscription = await ethers.getContractFactory("Subscription");

    const fakeFlixAddress = "0xb16529281CB0d2C69c18F952aCAe9621404DbA99";
    const spooftifyAddress = "0x19dF4DD15C5CA51270E5AF0c6e006b314BdC1540";
    const opensubsAddress = "0x5eeA17386B625bAd14B881a4776800e3D6A7e64E";


    const fakeflix = await deployFakeflix(Subscription, fakeFlixAddress, opensubsAddress);

    console.log(`Fakeflix deployed to ${fakeflix.address}`);

    const spooftify = await deploySpooftify(Subscription, spooftifyAddress, opensubsAddress);

    console.log(`Spooftify deployed to ${spooftify.address}`);

}

main().catch(e => {
    console.error(e);
    process.exitCode = 1;
});
