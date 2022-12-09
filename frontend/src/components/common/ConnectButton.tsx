import React, {useCallback} from "react";
import {connectWallet} from "../../utils/ProviderUtils";
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
    }, [changeAddress, provider]);

    return (
        <button onClick={onClick} className="connect-wallet-button">
            Connect wallet
        </button>
    )
}

export default ConnectButton;
