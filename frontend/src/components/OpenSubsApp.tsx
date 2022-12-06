import {useEffect, useState} from "react";
import {Contract, providers} from "ethers";
import ConnectButton from "./common/ConnectButton";
import {autoLogin} from "../utils/ProviderUtils";
import {getSubscriptionContract, getTokensOwnedByUser} from "../utils/SubscriptionUtil";

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
                for (const [serviceName, contractDescription] of Object.entries(contracts)) {
                    balances[serviceName] = await getTokensOwnedByUser(contractDescription.contract, address);
                }
                console.log(balances);
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

    return (
        <div>
            <p>OpenSubs !! !</p>
            <p>{address}</p>
            <ConnectButton changeAddress={setAddress} provider={provider}/>
        </div>
    )
}

export default OpenSubsApp;
