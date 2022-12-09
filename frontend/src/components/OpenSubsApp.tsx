import "../css/opensubs.css";
import {createContext, useEffect, useState} from "react";
import {Contract, providers} from "ethers";
import {autoLogin, isChainIdSupported} from "../utils/ProviderUtils";
import {
    getSubscriptionContract,
    getBalanceOfOwnedTokens,
    getOwnedTokensByUser,
    getBalanceOfUsedTokens, getUsedTokensByUser, isTokenRentable, isTokenReclaimable
} from "../utils/SubscriptionUtil";
import OpenSubsHeader from "./openSubs/OpenSubsHeader";
import {Navigate, Route, Routes } from "react-router-dom";
import OpenSubsMyTokens from "./openSubs/OpenSubsMyTokens";
import OpenSubsToken from "./openSubs/OpenSubsToken";

type ContractDescription = {
    /**
     * The address of the contract
     */
    address: string;

    /**
     * The contract instance
     */
    contract: Contract;
}

export type ServiceName = "fakeflix" | "spooftify";

type ContractsList = {
    [key in ServiceName]: ContractDescription;
};

const contractAddresses: {[key in ServiceName]: string} = {
    fakeflix: String(process.env.REACT_APP_FAKEFLIX_CONTRACT_ADDRESS),
    spooftify: String(process.env.REACT_APP_SPOOFTIFY_CONTRACT_ADDRESS),
};

type OpenSubsAppContext = {
    address: string,
    contracts: ContractsList | null,
}

export const openSubsAppContext = createContext<OpenSubsAppContext>({
    address: '',
    contracts: null,
});

function OpenSubsApp() {

    const [provider, setProvider] = useState<providers.Web3Provider | null | undefined>(undefined);

    const [address, setAddress] = useState('');

    const [chainId, setChainId] = useState<number | null>(null);

    const [contracts, setContracts] = useState<ContractsList | null>(null);

    useEffect(() => {
        const initialBackgroundColor = document.body.style.backgroundColor;
        const initialColor = document.body.style.color;

        document.body.style.backgroundColor = "#f8f8f8";
        document.body.style.color = "#080808";

        return (() => {
            document.body.style.backgroundColor = initialBackgroundColor;
            document.body.style.color = initialColor;
        });
    });

    useEffect(() => {
        (async () => {
            if (window.ethereum) {
                const web3Provider = new providers.Web3Provider(window.ethereum);

                setProvider(new providers.Web3Provider(window.ethereum));

                const loggedAddress = await autoLogin(web3Provider);

                if (loggedAddress) {
                    setAddress(loggedAddress);
                }

                window.ethereum.on('accountsChanged', (accounts: any) => {
                    if (accounts.length === 0) {
                        setAddress('');
                        return;
                    }

                    setAddress(String(accounts[0]));
                });

                window.ethereum.on('chainChanged', () => {
                    window.location.reload();
                })
            } else {
                setProvider(null);
            }
        })();
    }, []);

    useEffect(() => {
        if (!provider) {
            return;
        }

        (async () => {
            const contractDescriptions: Partial<ContractsList> = {};

            for (const [serviceName, address] of Object.entries(contractAddresses)) {
                contractDescriptions[serviceName as ServiceName] = {
                    address,
                    contract: getSubscriptionContract(provider, address),
                };
            }

            setContracts(contractDescriptions as ContractsList);
            setChainId((await provider.getNetwork()).chainId);
        })();

    }, [provider]);

    if (provider === undefined) {
        return (
            <div>Loading...</div>
        )
    }

    if (provider === null) {
        return (
            <div>Install metamask</div>
        )
    }

    if (chainId && !isChainIdSupported(chainId)) {
        return (
            <div>Unsupported network</div>
        )
    }

    return (
        <div className="opensubs-app">
            <openSubsAppContext.Provider value={{
                address,
                contracts,
            }}>
                <OpenSubsHeader address={address}
                                changeAddress={setAddress}
                                provider={provider}
                />
                <Routes>
                    <Route path="/" element={<p>Marketplace</p>}/>
                    <Route path="my-subscriptions" element={<OpenSubsMyTokens/>}/>
                    <Route path="/:platform/:tokenId" element={<OpenSubsToken/>}/>

                    <Route path="*" element={<Navigate to="/opensubs" replace/>}/>
                </Routes>
            </openSubsAppContext.Provider>
        </div>
    )
}

export default OpenSubsApp;
