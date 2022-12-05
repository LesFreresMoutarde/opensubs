import React, {useCallback} from "react";
import {connectWallet} from "../../utils/providerUtils";
import {providers} from "ethers";

interface ConnectButtonProps {
    changeAddress: (address: string) => void;
    provider: providers.Web3Provider
}

function ConnectButton({changeAddress, provider}: ConnectButtonProps) {

    const onClick = useCallback(async () => {
        try {
            const address = await connectWallet(provider);

            changeAddress(address);
        } catch (error: any) {
            console.error(error);
        }
    }, []);

    return (
        <button onClick={onClick}>LOG IN</button>
    )
}

export default ConnectButton;
