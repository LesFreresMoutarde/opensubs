import {useEffect, useState} from "react";
import {providers} from "ethers";
import ConnectButton from "./common/ConnectButton";
import {autoLogin} from "../utils/ProviderUtils";

function OpenSubsApp() {

    const [provider, setProvider] = useState<providers.Web3Provider | null | undefined>(undefined);

    const [address, setAddress] = useState('');

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
