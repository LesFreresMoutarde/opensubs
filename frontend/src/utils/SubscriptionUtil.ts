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

async function getUsedTokensByUser(contract: Contract, address: string, balance: bigint|number): Promise<BigNumber[]> {
    const tokenIds: BigNumber[] = [];

    for (let i = 0; i < balance; i++) {
        tokenIds.push(await contract.tokenOfUserByIndex(address, i))
    }

    return tokenIds;
}

async function isContentAvailableFromToken(contract: Contract, tokenId: BigNumber, type: 'owned' | 'used'): Promise<boolean> {
    const subscriptionExpirationTimestamp = await contract.expiresAt(tokenId) * 1000;

    if (Date.now() >= subscriptionExpirationTimestamp) {
        return false;
    }

    switch (type) {
        case 'owned':
            const user = await contract.userOf(tokenId);

            if (user !== ethers.constants.AddressZero) {
                return false;
            }

            break;
        case 'used':
            const rentExpiration = await contract.userExpires(tokenId) * 1000;

            if (Date.now() >= rentExpiration) {
                return false;
            }

            break;
        default:
            return false;
    }

    return true;
}

async function isTokenRentable(contract: Contract, tokenId: BigNumber, address: string) {
    const ownerOf = await contract.ownerOf(tokenId);

    if (ethers.utils.getAddress(address) !== ownerOf) {
        return false;
    }

    const subscriptionExpiration = await contract.expiresAt(tokenId) * 1000;

    if (Date.now() > subscriptionExpiration) {
        return false;
    }

    const userOf = await contract.userOf(tokenId);

    if (userOf !== ethers.constants.AddressZero) {
        return false;
    }

    return true;
}

async function isTokenReclaimable(contract: Contract, tokenId: BigNumber, address: string) {
    const ownerOf = await contract.ownerOf(tokenId);

    if (ethers.utils.getAddress(address) !== ownerOf) {
        return false;
    }

    const userOf = await contract.userOf(tokenId);

    if (userOf === ethers.constants.AddressZero){
        return false;
    }

    const userExpires = await contract.userExpires(tokenId) * 1000;

    if (Date.now() < userExpires) {
        return false;
    }

    return true;
}

export {
    getSubscriptionContract,
    getBalanceOfOwnedTokens,
    getBalanceOfUsedTokens,
    getUsedTokensByUser,
    getOwnedTokensByUser,
    isContentAvailableFromToken,
    isTokenRentable,
    isTokenReclaimable
}
