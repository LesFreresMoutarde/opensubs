import {ethers, upgrades} from "hardhat";
import {Subscription} from "../typechain-types";
import {BigNumber, ContractFactory} from "ethers";

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

async function mintFixturesTokens(fakeflix: Subscription, spooftify: Subscription, ethUsdRate: any, accounts: any) {
    const fakeflixContentSubscriptionPrice = await fakeflix.contentSubscriptionPrice();

    const amountToSendToFakeflix = Math.floor(ethUsdRate * fakeflixContentSubscriptionPrice / 100);

    const spooftifyContentSubscriptionPrice = await spooftify.contentSubscriptionPrice();

    const amountToSendToSpooftify = Math.floor(ethUsdRate * spooftifyContentSubscriptionPrice  / 100);

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

    console.log("accounts1", accounts[1].address);

    console.log("accounts2", accounts[2].address);


    // Account0 :  1 Fakeflix - 2 Sp
    // Account1 : 1 FF - 1 SP
    // Account2 : 1 FF - 0 SP
}

main().catch(e => {
    console.error(e);
    process.exitCode = 1;
});
