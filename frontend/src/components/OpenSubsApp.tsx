import {useEffect, useState} from "react";
import {Contract, providers} from "ethers";
import ConnectButton from "./common/ConnectButton";
import {autoLogin} from "../utils/ProviderUtils";
import {getSubscriptionContract} from "../utils/SubscriptionUtil";

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
            } else {
                setProvider(null);
            }
        })();
    }, []);

    useEffect(() => {
        if (!provider) {
            return;
        }

        const contractDescriptions: Partial<ContractsList> = {};

        for (const [serviceName, address] of Object.entries(contractAddresses)) {
            contractDescriptions[serviceName as ServiceName] = {
                address,
                contract: getSubscriptionContract(provider, address),
            };
        }

        setContracts(contractDescriptions as ContractsList);
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

    return (
        <div>
            <p>OpenSubs !! !</p>
            <p>{address}</p>
            <ConnectButton changeAddress={setAddress} provider={provider}/>
        </div>
    )
}

export default OpenSubsApp;
