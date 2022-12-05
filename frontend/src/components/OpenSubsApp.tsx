import {useEffect, useState} from "react";
import {providers} from "ethers";
import ConnectButton from "./common/ConnectButton";

function OpenSubsApp() {

    const [provider, setProvider] = useState<providers.Web3Provider | null | undefined>(undefined);

    const [address, setAddress] = useState('');

    useEffect(() => {
        if (window.ethereum) {
            setProvider(new providers.Web3Provider(window.ethereum));
        } else {
            setProvider(null);
        }
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
