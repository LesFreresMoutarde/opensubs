import {useEffect, useState} from "react";
import {Contract, providers} from "ethers";
import ConnectButton from "./common/ConnectButton";
import {autoLogin, isChainIdSupported} from "../utils/ProviderUtils";
import {
    getSubscriptionContract,
    getBalanceOfOwnedTokens,
    getOwnedTokensByUser, getBalanceOfUsedTokens, getUsedTokensByUser, isContentAvailableFromToken
} from "../utils/SubscriptionUtil";
import FakeflixHeader from "./fakeflix/FakeflixHeader";
import "../css/fakeflix.css";

function FakeflixApp() {

    const [provider, setProvider] = useState<providers.Web3Provider | null | undefined>(undefined);

    const [address, setAddress] = useState('');

    const [chainId, setChainId] = useState<number | null>(null);

    const [subscription, setSubscription] = useState<Contract | null>(null);

    const [isContentAvailable, setIsContentAvailable] = useState<boolean | null>(null);

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
            <FakeflixHeader address={address}
                            changeAddress={setAddress}
                            provider={provider}
            />

            {address &&
            <>
                {isContentAvailable === null &&
                <p>Verifying your tokens...</p>
                }

                {isContentAvailable === false &&
                <p>You are not authorized to access content</p>
                }

                {isContentAvailable === true &&
                <p>TODO App content</p>
                }
            </>
            }
        </div>
    )
}

export default FakeflixApp;
