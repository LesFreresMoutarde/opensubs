import {Navigate, useParams} from "react-router-dom";
import {useContext, useEffect, useState} from "react";
import {BigNumber} from "ethers";
import {openSubsAppContext, ServiceName} from "../OpenSubsApp";
import { areAdressesEqual } from "../../utils/Util";
import {isTokenBorrowable, isTokenReclaimable, isTokenRentable} from "../../utils/SubscriptionUtil";

function OpenSubsToken() {
    const {address, contracts} = useContext(openSubsAppContext)

    const {platform, tokenId} = useParams();

    const [notFound, setNotFound] = useState(false);

    const [owner, setOwner] = useState<string | null>(null);
    const [isRentable, setIsRentable] = useState(false);
    const [isBorrowable, setIsBorrowable] = useState(false);
    const [isReclaimable, setIsReclaimable] = useState(false);

    useEffect(() => {
        if (!contracts) {
            return;
        }

        if (!address) {
            return;
        }

        let tokenIdBn: BigNumber;

        try {
            tokenIdBn = BigNumber.from(tokenId);
        } catch {
            setNotFound(true);
            return;
        }

        if (!contracts.hasOwnProperty(platform as string)) {
            setNotFound(true);
            return;
        }

        (async () => {
            const contract = contracts[platform as ServiceName].contract;

            setIsRentable(await isTokenRentable(contract, tokenIdBn, address));
            setIsBorrowable(await isTokenBorrowable(contract, tokenIdBn, address));
            setIsReclaimable(await isTokenReclaimable(contract, tokenIdBn, address));

            try {
                const owner = await contract.ownerOf(tokenIdBn);
                setOwner(owner);
            } catch {
                setNotFound(true);
            }
        })();
    }, [address, contracts, platform]);

    if (notFound) {
        return (
            <Navigate to="/opensubs" replace/>
        )
    }

    return (
        <div className="token-details-page">
            <h1>Token details {platform} {tokenId}</h1>
            <p>
                Owner: {owner}

                {owner && areAdressesEqual(owner, address) &&
                <span>(you)</span>
                }
            </p>

            <p>
                <ul>
                    <li>Rentable : {isRentable ? 'yes' : 'no'}</li>
                    <li>Borrowable : {isBorrowable ? 'yes' : 'no'}</li>
                    <li>Reclaimable : {isReclaimable ? 'yes' : 'no'}</li>
                </ul>
            </p>
        </div>
    );
}

export default OpenSubsToken;
