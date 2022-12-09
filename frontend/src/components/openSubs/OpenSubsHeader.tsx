import {providers} from "ethers";
import {shortenAddress} from "../../utils/Util";
import ConnectButton from "../common/ConnectButton";
import OpenSubsNavbar from "./OpenSubsNavbar";

interface OpenSubsHeaderProps {
    address: string;
    changeAddress: (address: string) => any;
    provider: providers.Web3Provider;
}

function OpenSubsHeader({address, changeAddress, provider}: OpenSubsHeaderProps) {
    return (
        <header className="opensubs-app-header">
            <div className="header-logo">
                <img src="/opensubs/opensubs-inline-logo.png" alt="Logo"/>
            </div>
            <OpenSubsNavbar/>
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

export default OpenSubsHeader;
