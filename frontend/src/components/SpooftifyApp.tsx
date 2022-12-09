import "../css/spooftify.css";
import {createContext, useCallback, useEffect, useState} from "react";
import {Contract, providers} from "ethers";
import {autoLogin, isChainIdSupported} from "../utils/ProviderUtils";
import {
    getSubscriptionContract,
    getBalanceOfOwnedTokens,
    getOwnedTokensByUser, getBalanceOfUsedTokens, getUsedTokensByUser, isContentAvailableFromToken
} from "../utils/SubscriptionUtil";

import CONTENT_JSON from "../apps-content/spooftify.json";
import SpooftifyHeader from "./spooftify/SpooftifyHeader";
import {Navigate, Route, Routes } from "react-router-dom";
import SpooftifyHome from "./spooftify/SpooftifyHome";
import SpooftifyMint from "./spooftify/SpooftifyMint";

type ContentItem = {
    /**
     * The track title
     */
    title: string;

    /**
     * The artist who made the track
     */
    artist: string;

    /**
     * The URL to a cover image
     */
    coverUrl: string;

    /**
     * The URL to an audio file
     */
    songUrl: string;
}

type AppContent = ContentItem[];

type SelectedItem = [number, ContentItem];

type SpooftifyAppContext = {
    address: string,
    isContentAvailable: boolean | null,
    content: AppContent;
    selectedItem: SelectedItem | null;
    selectItem: (id: number | null) => any;
    subscription: Contract | null;
    provider: providers.Web3Provider | null;
}

export const spooftifyAppContext = createContext<SpooftifyAppContext>({
    address: '',
    isContentAvailable: null,
    content: [],
    selectedItem: null,
    selectItem: () => {},
    subscription: null,
    provider: null
});

function SpooftifyApp() {

    const [provider, setProvider] = useState<providers.Web3Provider | null | undefined>(undefined);

    const [address, setAddress] = useState('');

    const [chainId, setChainId] = useState<number | null>(null);

    const [subscription, setSubscription] = useState<Contract | null>(null);

    const [isContentAvailable, setIsContentAvailable] = useState<boolean | null>(null);

    const [appContent, setAppContent] = useState<AppContent>([]);

    const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);

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
            setChainId((await provider.getNetwork()).chainId);
            setSubscription(getSubscriptionContract(provider, String(process.env.REACT_APP_SPOOFTIFY_CONTRACT_ADDRESS)));
        })();
    }, [provider]);

    useEffect(() => {
        if (address === '') {
            return;
        }

        if (!subscription) {
            return;
        }

        (async () => {
            const ownedBalances = await getBalanceOfOwnedTokens(subscription, address);
            const ownedTokenIds = await getOwnedTokensByUser(subscription, address, ownedBalances.toBigInt());

            const usedBalances = await getBalanceOfUsedTokens(subscription, address);
            const usedTokenIds = await  getUsedTokensByUser(subscription, address, usedBalances.toBigInt());

            for (const ownedTokenId of ownedTokenIds) {
                if (await isContentAvailableFromToken(subscription, ownedTokenId, 'owned')) {
                    setIsContentAvailable(true);
                    return;
                }
            }

            for (const usedTokenId of usedTokenIds) {
                if (await isContentAvailableFromToken(subscription, usedTokenId, 'used')) {
                    setIsContentAvailable(true);
                    return;
                }
            }

            setIsContentAvailable(false);
        })();

    }, [address, subscription]);

    useEffect(() => {
        if (isContentAvailable) {
            setAppContent(CONTENT_JSON);
            return;
        }

        setAppContent([]);
    }, [isContentAvailable]);

    const selectItem = useCallback((itemId: number | null) => {
        if (itemId === null) {
            setSelectedItem(null);
            return;
        }

        setSelectedItem([itemId, appContent[itemId]]);
    }, [appContent]);

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
        <div className="spooftify-app">
            <SpooftifyHeader address={address}
                             changeAddress={setAddress}
                             provider={provider}
            />

            <spooftifyAppContext.Provider value={{
                address,
                isContentAvailable,
                content: appContent,
                selectedItem,
                selectItem,
                subscription,
                provider
            }}>
                <Routes>
                    <Route path="/" element={<SpooftifyHome/>}/>
                    <Route path="/mint" element={<SpooftifyMint/>}/>

                    <Route path="*" element={<Navigate to="/spooftify" replace/>}/>
                </Routes>
            </spooftifyAppContext.Provider>
        </div>

    )
}

export default SpooftifyApp;
