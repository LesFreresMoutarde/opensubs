import {useEffect, useState} from "react";
import {Contract, providers} from "ethers";
import ConnectButton from "./common/ConnectButton";
import {autoLogin} from "../utils/ProviderUtils";
import {
    getSubscriptionContract,
    getBalanceOfOwnedTokens,
    isChainIdSupported,
    getOwnedTokensByUser, getBalanceOfUsedTokens, getUsedTokensByUser
} from "../utils/SubscriptionUtil";
function FakeflixApp() {

    const [provider, setProvider] = useState<providers.Web3Provider | null | undefined>(undefined);

    const [address, setAddress] = useState('');

    const [chainId, setChainId] = useState<number | null>(null);

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
            setSubscription(getSubscriptionContract(provider, String(process.env.REACT_APP_FAKEFLIX_CONTRACT_ADDRESS)));
        })();
    }, [provider]);

    useEffect(() => {

        if (address === '') {
            return;
        }

        if (subscription) {
            (async () => {
                const ownedBalances = await getBalanceOfOwnedTokens(subscription, address);
                const ownedTokenIds = await getOwnedTokensByUser(subscription, address, ownedBalances.toBigInt());
                console.log('Owned tokenIds', ownedTokenIds);

                const usedBalances = await getBalanceOfUsedTokens(subscription, address);
                const usedTokenIds = await  getUsedTokensByUser(subscription, address, usedBalances.toBigInt());
                console.log('used tokenIds', usedTokenIds);
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
            <p>Fakeflix ! tudum</p>
            <p>{address}</p>
            <ConnectButton changeAddress={setAddress} provider={provider}/>
        </div>
    )
}

export default FakeflixApp;
