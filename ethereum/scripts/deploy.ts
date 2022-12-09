import {ethers, upgrades} from "hardhat";
import {Subscription} from "../typechain-types";
import {BigNumber, ContractFactory} from "ethers";
import {time} from "@nomicfoundation/hardhat-network-helpers";

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

async function deployFakeflix(
    Subscription: ContractFactory,
    fakeflixAccountAddress: string,
    marketplaceAccountAddress: string
): Promise<Subscription> {
    const fakeflixContentSubscriptionPrice = 1549; // $15,49
    const fakeflixMinRentPrice = 100; // $1
    const fakeflixMinRentDuration = 120; // 2 minutes
    const fakeFlixContentSubscriptionDuration = 30 * 24 * 60 * 60; // 1 month

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
        ],
        {initializer: "initialize", kind: "transparent"}
    ) as Subscription;

    await spooftify.deployed();

    return spooftify;
}

async function mintFixturesTokens(fakeflix: Subscription, spooftify: Subscription, {rate, decimals}: {rate: BigNumber, decimals: number}, accounts: any) {
    const fakeflixContentSubscriptionPrice = await fakeflix.contentSubscriptionPrice();

    const rateWithDecimalsBN = rate.div(BigNumber.from((10 ** decimals).toString()));

    const amountToSendToFakeflix =  BigNumber.from(fakeflixContentSubscriptionPrice)
        .mul(BigNumber.from((10**18).toString()))
        .div(rateWithDecimalsBN)
        .div(100);


    const spooftifyContentSubscriptionPrice = await spooftify.contentSubscriptionPrice();

    const amountToSendToSpooftify = BigNumber.from(spooftifyContentSubscriptionPrice)
        .mul(BigNumber.from((10**18).toString()))
        .div(rateWithDecimalsBN)
        .div(100);

    const fakeflixConnectedSubscription0 = fakeflix.connect(accounts[0]);

    await fakeflixConnectedSubscription0.mint({value: amountToSendToFakeflix});

    const fakeflixConnectedSubscription1 = fakeflix.connect(accounts[1]);

    await fakeflixConnectedSubscription1.mint({value: amountToSendToFakeflix});

    const fakeflixConnectedSubscription2 = fakeflix.connect(accounts[2]);

    await fakeflixConnectedSubscription2.mint({value: amountToSendToFakeflix});

    const spooftifyConnectedSubscription0 = spooftify.connect(accounts[0]);

    await spooftifyConnectedSubscription0.mint({value: amountToSendToSpooftify});

    await spooftifyConnectedSubscription0.mint({value: amountToSendToSpooftify});

    const spooftifyConnectedSubscription1 = spooftify.connect(accounts[1]);

    await spooftifyConnectedSubscription1.mint({value: amountToSendToSpooftify});

    // Account0 :  1 Fakeflix - 2 Sp
    // Account1 : 1 FF - 1 SP
    // Account2 : 1 FF - 0 SP
}

async function rentTokenIds(fakeflix: Subscription, spooftify: Subscription, {rate, decimals}: {rate: BigNumber, decimals: number}, accounts: any) {
    const fakeflixMinRentPrice = await fakeflix.minRentPrice();
    const spooftifyMinRentPrice = await spooftify.minRentPrice();

    const fakeflixMinRentDuration = await fakeflix.minRentDuration();
    const spooftifyMinRentDuration = await spooftify.minRentDuration();

    /* Create offers for rent */
    const spooftifyTokenId = 1;
    const fakeflixTokenId = 2

    const connectedSpooftifyAccount0 = spooftify.connect(accounts[0]);

    // Account0 has tokenId 1 and 2 in spooftify
    await connectedSpooftifyAccount0.offerForRent(spooftifyTokenId, spooftifyMinRentPrice + 100, spooftifyMinRentDuration);

    const connectedFakeflixAccount1 = fakeflix.connect(accounts[1]);

    // Account1 has token id 2 in fakeflix
    await connectedFakeflixAccount1.offerForRent(fakeflixTokenId, fakeflixMinRentPrice + 100, fakeflixMinRentDuration * 10);

    /* Rent tokens */
    const rateWithDecimalsBN = rate.div(BigNumber.from((10 ** decimals).toString()));

    // Spooftify token
    const spooftifyToken1RentingConditions = await spooftify.getRentingConditions(spooftifyTokenId);

    const amountToSendForSpooftifyToken1 = BigNumber.from(spooftifyToken1RentingConditions.price)
        .mul(BigNumber.from((10**18).toString()))
        .div(rateWithDecimalsBN)
        .div(100);

    const connectedSpooftifyAccount3 = spooftify.connect(accounts[3]);

    await connectedSpooftifyAccount3.rent(spooftifyTokenId, {value: amountToSendForSpooftifyToken1});

    // Fakeflix token
    const fakeflixToken2RentingConditions = await fakeflix.getRentingConditions(fakeflixTokenId);

    const amountToSendForFakeflixToken2 = BigNumber.from(fakeflixToken2RentingConditions.price)
        .mul(BigNumber.from((10**18).toString()))
        .div(rateWithDecimalsBN)
        .div(100);

    const connectedFakeflixAccount4 = fakeflix.connect(accounts[4]);

    await connectedFakeflixAccount4.rent(fakeflixTokenId, {value: amountToSendForFakeflixToken2});

    // Create offer for rent
    // Account 0 - 1 sp en location
    // Account 1 - 1 ff en location

    // Renting tokens
    // Account 3 - rent 1 SP
    // Account 4 - rent 1 FF
}

async function main() {
    const Subscription = await ethers.getContractFactory("Subscription");

    const [
        fakeflixAccount,
        spooftifyAccount,
        marketplaceAccount,
        ...accounts
    ] = await ethers.getSigners();

    const fakeflix = await deployFakeflix(Subscription, fakeflixAccount.address, marketplaceAccount.address);

    console.log(`Fakeflix deployed to ${fakeflix.address}`);

    const spooftify = await deploySpooftify(Subscription, spooftifyAccount.address, marketplaceAccount.address);

    console.log(`Spooftify deployed to ${spooftify.address}`);

    const provider = ethers.getDefaultProvider("http://localhost:8545");

    const priceFeed = new ethers.Contract(chainlinkGoerliPriceFeedForEthUsdAddress, aggregatorV3InterfaceABI, provider);

    const roundData = await priceFeed.latestRoundData();

    const decimals = await priceFeed.decimals();

    await mintFixturesTokens(fakeflix, spooftify, {rate:roundData.answer, decimals}, accounts);

    await rentTokenIds(fakeflix, spooftify, {rate: roundData.answer, decimals}, accounts);

    console.log("accounts0", accounts[0].address);
    console.log("accounts1", accounts[1].address);
    console.log("accounts2", accounts[2].address);
    console.log("accounts3", accounts[3].address);
    console.log("accounts4", accounts[4].address);

}

main().catch(e => {
    console.error(e);
    process.exitCode = 1;
});
