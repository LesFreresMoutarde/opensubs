import {providers} from "ethers";
import ConnectButton from "../common/ConnectButton";
import {shortenAddress} from "../../utils/Util";

interface SpooftifyHeaderProps {
    address: string;
    changeAddress: (address: string) => any;
    provider: providers.Web3Provider;
}

function SpooftifyHeader({address, changeAddress, provider}: SpooftifyHeaderProps) {
    return (
        <header className="fakeflix-app-header">
            <div className="header-logo">
                <img src="/fakeflix/img/fakeflix-logo.png" alt="Logo"/>
            </div>
            <div className="flex-spacer"/>
            <div className="header-right">
                {address &&
                <div className="header-address">
                    {shortenAddress(address)}
                </div>
                }

                {!address &&
                <div className="header-connect-wallet">
                    <ConnectButton changeAddress={changeAddress} provider={provider}/>
                </div>
                }
            </div>
        </header>
    );
}

export default SpooftifyHeader;
