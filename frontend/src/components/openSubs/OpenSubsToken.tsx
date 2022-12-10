import {Navigate, useParams} from "react-router-dom";
import React, {useCallback, useContext, useEffect, useRef, useState} from "react";
import {BigNumber, ethers} from "ethers";
import {openSubsAppContext, ServiceName} from "../OpenSubsApp";
import {areAdressesEqual, fireToast, getMetadataUrl, SubscriptionMetadata} from "../../utils/Util";
import {
    getMinimumRentingConditions,
    isTokenBorrowable, isTokenOfferCancellable,
    isTokenReclaimable,
    isTokenRentable, MinRentingConditions, offerForRent,
    reclaimToken
} from "../../utils/SubscriptionUtil";
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
    const [minRentingConditions, setMinRentingConditions] = useState<MinRentingConditions | null>(null);

    const priceInputRef = useRef<HTMLInputElement | null>(null);
    const durationInputRef = useRef<HTMLInputElement | null>(null);

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

            setMinRentingConditions(await getMinimumRentingConditions(contract));

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

        if (!address) {
            return;
        }

        if (!owner) {
            return;
        }

        const contract = contracts[platform as ServiceName].contract;

        const updateUserHandler = async (eventTokenId: BigNumber, user: string) => {
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

        const rentOfferCreatedHandler = async (eventTokenId: BigNumber) => {
            if (!BigNumber.from(tokenId).eq(eventTokenId)) {
                return;
            }

            if (!areAdressesEqual(address, String(owner))) {
                return;
            }

            setIsRentable(await isTokenRentable(contract, eventTokenId, address));

            setShowModal(false);

            fireToast('success', 'You have successfully created a renting offer');
        }

        contract.on('UpdateUser', updateUserHandler);

        contract.on('RentOfferCreated', rentOfferCreatedHandler);

        return (() => {
            contract.off('UpdateUser', updateUserHandler);

            contract.off('RentOfferCreated', rentOfferCreatedHandler);
        })
    }, [contracts, platform, tokenId, address, owner]);

    const createOfferForRent = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!contracts) {
            return;
        }

        if (!priceInputRef || !durationInputRef) {
            return;
        }

        const price = parseInt(priceInputRef.current!.value) * 100 || minRentingConditions!.minPrice * 100;

        const duration = parseInt(durationInputRef.current!.value) || minRentingConditions!.minDuration;

        await offerForRent(contracts[platform as ServiceName].contract, BigNumber.from(tokenId), price, duration);

        setShowModal(true);
    }, [tokenId, contracts, priceInputRef, durationInputRef]);

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

        await reclaimToken(contracts[platform as ServiceName].contract, BigNumber.from(tokenId));

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
                    <div>
                        <h3>Offer for rent</h3>
                        <form onSubmit={createOfferForRent}>
                            <div className="form-group">
                                <label htmlFor="renting-conditions-price">Price ($)</label>
                                <input type="number"
                                       className="form-control"
                                       id="renting-conditions-price"
                                       placeholder="Price"
                                       min={minRentingConditions!.minPrice}
                                       step="0.01"
                                       ref={priceInputRef}
                                       required
                                />
                            </div>
                            <div className="form-group mt-2">
                                <label htmlFor="renting-conditions-duration">Duration (seconds)</label>
                                <input type="number"
                                       className="form-control"
                                       id="renting-conditions-duration"
                                       placeholder="Duration"
                                       min={minRentingConditions!.minDuration}
                                       ref={durationInputRef}
                                       required
                                />
                            </div>
                            <div className="mt-3">
                                <button type="submit" className="btn btn-primary">Create offer</button>
                            </div>
                        </form>
                    </div>

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
