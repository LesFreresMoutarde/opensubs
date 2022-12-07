import {BigNumber, Contract, ethers, providers} from "ethers";
import SUBSCRIPTION_JSON from "../artifacts/contracts/Subscription.sol/Subscription.json";

function getSubscriptionContract(provider: providers.Web3Provider, address: string): Contract {
    return new ethers.Contract(address, SUBSCRIPTION_JSON.abi, provider.getSigner());
}

async function getBalanceOfOwnedTokens(contract: Contract, address: string): Promise<BigNumber> {
    return await contract.balanceOf(address);
}

async function getOwnedTokensByUser(contract: Contract, address: string, balance: bigint|number): Promise<BigNumber[]> {
    const tokenIds: BigNumber[] = [];

    for (let i = 0; i < balance; i++) {
        tokenIds.push(await contract.tokenOfOwnerByIndex(address, i))
    }

    return tokenIds;
}

async function getBalanceOfUsedTokens(contract: Contract, address: string): Promise<BigNumber> {
    return await contract.usedBalanceOf(address);
}

function isChainIdSupported(chainId: number): boolean {
    const supportedNetworks = [5, 31337];

    return supportedNetworks.includes(chainId);
}

export {
    getSubscriptionContract,
    getBalanceOfOwnedTokens,
    getBalanceOfUsedTokens,
    getUsedTokensByUser,
    isChainIdSupported,
    getOwnedTokensByUser
}
