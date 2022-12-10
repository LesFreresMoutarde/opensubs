import {Navigate, useParams} from "react-router-dom";
import {useCallback, useContext, useEffect, useState} from "react";
import {BigNumber, ethers} from "ethers";
import {openSubsAppContext, ServiceName} from "../OpenSubsApp";
import {areAdressesEqual, fireToast, getMetadataUrl, SubscriptionMetadata} from "../../utils/Util";
import {isTokenBorrowable, isTokenReclaimable, isTokenRentable, reclaimToken} from "../../utils/SubscriptionUtil";
import LoadingModal from "../common/LoadingModal";

function OpenSubsToken() {
    const {address, contracts, provider} = useContext(openSubsAppContext);

    const {platform, tokenId} = useParams();

    const [notFound, setNotFound] = useState(false);

    const [showModal, setShowModal] = useState<boolean>(false);

    const [owner, setOwner] = useState<string | null>(null);
    const [isRentable, setIsRentable] = useState(false);
    const [isBorrowable, setIsBorrowable] = useState(false);
    const [isReclaimable, setIsReclaimable] = useState(false);

    const [metadata, setMetadata] = useState<SubscriptionMetadata | null>(null);

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
            const metadataUrl = await getMetadataUrl(parseInt(tokenId!), platform as ServiceName);

            setMetadata(await (await fetch(metadataUrl)).json());

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
    }, [address, contracts, platform, tokenId]);

    useEffect(() => {
        if (!contracts) {
            return;
        }

        const contract = contracts[platform as ServiceName].contract;

        const handler = async (eventTokenId: BigNumber, user: string) => {
            if (!BigNumber.from(tokenId).eq(eventTokenId)) {
                return;
            }

            if (user !== ethers.constants.AddressZero) {
                return;
            }

            if (!areAdressesEqual(address, String(owner))) {
                return;
            }

            setIsRentable(await isTokenRentable(contract, eventTokenId, address));
            setIsBorrowable(await isTokenBorrowable(contract, eventTokenId, address));
            setIsReclaimable(await isTokenReclaimable(contract, eventTokenId, address));

            setShowModal(false);

            fireToast('success', 'You have successfully reclaimed your subscription');
        }

        contract.on('UpdateUser', handler);

        return (() => {
            contract.off('UpdateUser', handler);
        })
    }, [contracts, platform, tokenId, address, owner]);

    const reclaim = useCallback(async () => {
        if (!isReclaimable) {
            return;
        }

        if (!provider) {
            return;
        }

        if (!contracts) {
            return;
        }

        await reclaimToken(contracts[platform as ServiceName].contract, provider, BigNumber.from(tokenId));

        setShowModal(true);
    }, [provider, isReclaimable, contracts, tokenId, platform])

    if (notFound) {
        return (
            <Navigate to="/opensubs" replace/>
        )
    }

    return (
        <div className="token-details-page">
            {showModal && <LoadingModal showModal={showModal} closeModal={() => setShowModal(false)}/>}

            {!metadata &&
            <p>Loading...</p>
            }

            {metadata &&
            <div className="token-details">
                <div className="token-image" style={{
                    backgroundColor: metadata.background_color,
                }}>
                    <img src={metadata.image} alt="Logo"/>
                </div>

                <div className="token-data">
                    <h1>
                        {platform}#{tokenId} <a href={metadata.content_url} target="_blank">
                            <i className="fa-solid fa-arrow-up-right-from-square"/>
                        </a>

                    </h1>
                    <p>
                        Owner: {owner}

                        {owner && areAdressesEqual(owner, address) &&
                        <span> (you)</span>
                        }
                    </p>

                    <p>{metadata.description}</p>

                    {isRentable &&
                    <div>Interactions pour créer une offre</div>
                    }

                    {isBorrowable &&
                    <div>Interactions pour emprunter le token</div>
                    }

                    {isReclaimable &&
                    <div>
                        <button className="btn btn-success" onClick={reclaim}>
                            Reclaim
                        </button>
                    </div>
                    }
                </div>
            </div>
            }
        </div>
    );
}

export default OpenSubsToken;
