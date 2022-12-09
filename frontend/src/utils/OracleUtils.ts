import {ethers, providers} from "ethers";
import CHAINLINK_PRICE_FEED from "../artifacts/@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol/AggregatorV3Interface.json";

const chainlinkEthUsdPriceFeedAddress: string = "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e"

async function getChainlinkEthUsdPriceFeed(provider: providers.Web3Provider) {
    const priceFeed = new ethers.Contract(chainlinkEthUsdPriceFeedAddress, CHAINLINK_PRICE_FEED.abi, provider);

    const roundData = await priceFeed.latestRoundData();

    const decimals = await priceFeed.decimals();

    return {rate: roundData.answer, decimals};
}

export {getChainlinkEthUsdPriceFeed}
