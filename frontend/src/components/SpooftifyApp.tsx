import {useEffect, useState} from "react";
import {Contract, providers} from "ethers";
import ConnectButton from "./common/ConnectButton";
import {autoLogin} from "../utils/ProviderUtils";
import {
    getSubscriptionContract,
    getBalanceOfOwnedTokens,
    isChainIdSupported,
    getOwnedTokensByUser
} from "../utils/SubscriptionUtil";

function SpooftifyApp() {

    const [provider, setProvider] = useState<providers.Web3Provider | null | undefined>(undefined);

    const [address, setAddress] = useState('');

    const [chainId, setChainId] = useState<number | null>(null);

    const [subscription, setSubscription] = useState<Contract | null>(null);

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

        if (subscription) {
            (async () => {
                const balance = await getBalanceOfOwnedTokens(subscription, address);
                const tokenIds = await getOwnedTokensByUser(subscription, address, balance.toBigInt());
                console.log('tokenIds', tokenIds);
            })();
        }

    }, [address, subscription]);

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
        <div>
            <p>Spooftify</p>
            <p>{address}</p>
            <ConnectButton changeAddress={setAddress} provider={provider}/>
        </div>

    )
}

export default SpooftifyApp;
