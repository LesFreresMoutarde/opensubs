import {useEffect, useState} from "react";
import {Contract, providers} from "ethers";
import ConnectButton from "./common/ConnectButton";
import {autoLogin} from "../utils/ProviderUtils";
import {getSubscriptionContract} from "../utils/SubscriptionUtil";
function FakeflixApp() {

    const [provider, setProvider] = useState<providers.Web3Provider | null | undefined>(undefined);

    const [address, setAddress] = useState('');

    const [subscription, setSubscription] = useState<Contract | null>(null);

    useEffect(() => {
        (async () => {
            if (window.ethereum) {
                const web3Provider = new providers.Web3Provider(window.ethereum);

                setProvider(web3Provider);

                const loggedAddress = await autoLogin(web3Provider);

                if (loggedAddress) {
                    setAddress(loggedAddress);
                }
            } else {
                setProvider(null);
            }
        })()
    }, []);

    useEffect(() => {
        if (!provider) {
            return;
        }

        setSubscription(getSubscriptionContract(provider, String(process.env.REACT_APP_FAKEFLIX_CONTRACT_ADDRESS)));
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
            <p>Fakeflix ! tudum</p>
            <p>{address}</p>
            <ConnectButton changeAddress={setAddress} provider={provider}/>
        </div>
    )
}

export default FakeflixApp;
