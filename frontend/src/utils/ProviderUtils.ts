import {providers} from "ethers";

async function connectWallet(provider: providers.Web3Provider): Promise<string> {
    const accounts: string[] = await provider.send("eth_requestAccounts", []);

    if (accounts.length === 0) {
        throw new Error('No accounts found')
    }

    return accounts[0];
}

async function autoLogin(provider: providers.Web3Provider): Promise<string | null> {
    const accounts: string[] = await provider.send("eth_accounts", []);

    if (accounts.length > 0) {
        return accounts[0];
    }

    return null;
}

function isChainIdSupported(chainId: number): boolean {
    const supportedNetworks = [5, 31337];

    return supportedNetworks.includes(chainId);
}

export {connectWallet, autoLogin, isChainIdSupported};
