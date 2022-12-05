import {providers} from "ethers";

async function connectWallet(provider: providers.Web3Provider): Promise<string> {
    const accounts: string[] = await provider.send("eth_requestAccounts", []);

    return accounts[0];
}

export {connectWallet};
