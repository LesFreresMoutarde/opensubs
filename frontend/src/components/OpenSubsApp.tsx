import "../css/opensubs.css";
import {useEffect, useState} from "react";
import {Contract, providers} from "ethers";
import ConnectButton from "./common/ConnectButton";
import {autoLogin, isChainIdSupported} from "../utils/ProviderUtils";
import {
    getSubscriptionContract,
    getBalanceOfOwnedTokens,
    getOwnedTokensByUser,
    getBalanceOfUsedTokens, getUsedTokensByUser, isTokenRentable, isTokenReclaimable
} from "../utils/SubscriptionUtil";
import OpenSubsHeader from "./openSubs/OpenSubsHeader";
import {Route, Routes } from "react-router-dom";

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

type ServiceName = "fakeflix" | "spooftify";

type ContractsList = {
    [key in ServiceName]: ContractDescription;
};

const contractAddresses: {[key in ServiceName]: string} = {
    fakeflix: String(process.env.REACT_APP_FAKEFLIX_CONTRACT_ADDRESS),
    spooftify: String(process.env.REACT_APP_SPOOFTIFY_CONTRACT_ADDRESS),
};

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

    useEffect(() => {

        if (address === '') {
            return;
        }

        if (contracts) {
            (async () => {
                const balances: any = {};
                const tokenIds: any = {};

                for (const [serviceName, contractDescription] of Object.entries(contracts)) {
                    balances[serviceName] = {owned: [], used: []};
                    tokenIds[serviceName]= {owned: [], used: []};

                    balances[serviceName].owned = await getBalanceOfOwnedTokens(contractDescription.contract, address);
                    tokenIds[serviceName].owned = await getOwnedTokensByUser(
                        contractDescription.contract,
                        address,
                        balances[serviceName].owned.toBigInt()
                    );

                    balances[serviceName].used = await getBalanceOfUsedTokens(contractDescription.contract, address);
                    tokenIds[serviceName].used = await getUsedTokensByUser(
                        contractDescription.contract,
                        address,
                        balances[serviceName].used.toBigInt()
                    );
                }

                for (const serviceName in tokenIds) {
                    for (const [type, tokens] of Object.entries<any>(tokenIds[serviceName])) {
                        if (tokens.length > 0) {
                            for (const token of tokens) {
                                console.log("token, service, type", token, serviceName, type)
                                console.log("isRentable", await isTokenRentable(contracts[serviceName as ServiceName].contract, token, address))
                                console.log("isReclaimable", await isTokenReclaimable(contracts[serviceName as ServiceName].contract, token, address))
                            }
                        }
                    }
                }

            })();
        }

    }, [address, contracts]);

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
            <OpenSubsHeader address={address}
                            changeAddress={setAddress}
                            provider={provider}
            />
            <Routes>
                <Route path="my-subscriptions" element={<p>My subscriptions</p>}/>
                <Route path="subscriptions-for-rent" element={<p>Subscriptions for rent</p>}/>
            </Routes>
        </div>
    )
}

export default OpenSubsApp;
