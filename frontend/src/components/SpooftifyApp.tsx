import {useEffect, useState} from "react";
import {Contract, providers} from "ethers";
import ConnectButton from "./common/ConnectButton";
import {autoLogin} from "../utils/ProviderUtils";
import {getSubscriptionContract} from "../utils/SubscriptionUtil";

import CONTENT_JSON from "../apps-content/spooftify.json";

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

function SpooftifyApp() {

    const [provider, setProvider] = useState<providers.Web3Provider | null | undefined>(undefined);

    const [address, setAddress] = useState('');

    const [subscription, setSubscription] = useState<Contract | null>(null);

    const [appContent, setAppContent] = useState<AppContent>([]);

    useEffect(() => {
        (async () => {
            if (window.ethereum) {
                const web3Provider = new providers.Web3Provider(window.ethereum);

                setProvider(new providers.Web3Provider(window.ethereum));

                const loggedAddress = await autoLogin(web3Provider);

                if (loggedAddress) {
                    setAddress(loggedAddress);
                }
            } else {
                setProvider(null);
            }
        })();
    }, []);

    // TODO initialize content only once we're sure user has a valid subscription ?
    useEffect(() => {
        setAppContent(CONTENT_JSON);
    }, []);

    useEffect(() => {
        if (!provider) {
            return;
        }

        setSubscription(getSubscriptionContract(provider, String(process.env.REACT_APP_SPOOFTIFY_CONTRACT_ADDRESS)));
    }, [provider]);

    useEffect(() => {
        console.log(subscription);

        if (subscription === null) {
            return;
        }

        (async () => {
            console.log(await subscription.contentSubscriptionPrice());
        })();
    }, [subscription]);

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

    return (
        <div>
            <p>Spooftify</p>
            <p>{address}</p>
            <ConnectButton changeAddress={setAddress} provider={provider}/>
        </div>

    )
}

export default SpooftifyApp;
