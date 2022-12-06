import {BigNumber, Contract, ethers, providers} from "ethers";
import SUBSCRIPTION_JSON from "../artifacts/contracts/Subscription.sol/Subscription.json";

function getSubscriptionContract(provider: providers.Web3Provider, address: string): Contract {
    return new ethers.Contract(address, SUBSCRIPTION_JSON.abi, provider.getSigner());
}

async function getTokensOwnedByUser(contract: Contract, address: string): Promise<BigNumber> {
    return await contract.balanceOf(address);
}

function isChainIdSupported(chainId: number): boolean {
    const supportedNetworks = [5, 31337];

    return supportedNetworks.includes(chainId);
}

export {getSubscriptionContract, getTokensOwnedByUser, isChainIdSupported}
