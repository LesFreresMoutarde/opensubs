import {Navigate, useParams} from "react-router-dom";
import React, {useCallback, useContext, useEffect, useRef, useState} from "react";
import {BigNumber, Contract, ethers, providers} from "ethers";
import {openSubsAppContext, ServiceName} from "../OpenSubsApp";
import {areAdressesEqual, fireToast, getMetadataUrl, SubscriptionMetadata} from "../../utils/Util";
import {
    cancelOffer,
    getMinimumRentingConditions, getRentingConditions,
    isTokenBorrowable, isTokenOfferCancellable,
    isTokenReclaimable,
    isTokenRentable, MinRentingConditions, offerForRent,
    reclaimToken, RentingConditions, rentToken
} from "../../utils/SubscriptionUtil";
import LoadingModal from "../common/LoadingModal";

function OpenSubsToken() {
    const {address, contracts, provider} = useContext(openSubsAppContext);

    const {platform, tokenId} = useParams();

    const [notFound, setNotFound] = useState(false);

    const [showModal, setShowModal] = useState<boolean>(false);

    const [owner, setOwner] = useState<string | null>(null);
    const [borrower, setBorrower] = useState<string>(ethers.constants.AddressZero);
    const [isRentable, setIsRentable] = useState(false);
    const [isBorrowable, setIsBorrowable] = useState(false);
    const [isReclaimable, setIsReclaimable] = useState(false);
    const [isOfferCancellable, setIsOfferCancellable] = useState(false);

    const [metadata, setMetadata] = useState<SubscriptionMetadata | null>(null);
    const [minRentingConditions, setMinRentingConditions] = useState<MinRentingConditions | null>(null);
    const [rentingConditions, setRentingConditions] = useState<RentingConditions | null>(null);

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
            setRentingConditions(await getRentingConditions(contract, tokenIdBn));

            setIsRentable(await isTokenRentable(contract, tokenIdBn, address));
            setIsBorrowable(await isTokenBorrowable(contract, tokenIdBn, address));
            setIsReclaimable(await isTokenReclaimable(contract, tokenIdBn, address));
            setIsOfferCancellable(await isTokenOfferCancellable(contract, tokenIdBn, address));
            try {
                const owner = await contract.ownerOf(tokenIdBn);
                setOwner(owner);

                const borrower = await contract.userOf(tokenIdBn);

                setBorrower(borrower);
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
            const tokenIdBn = BigNumber.from(tokenId);

            if (!tokenIdBn.eq(eventTokenId)) {
                return;
            }

            if (areAdressesEqual(user, ethers.constants.AddressZero)) {
                if (!areAdressesEqual(address, String(owner))) {
                    return;
                }

                await refreshTokenStates(contract, tokenIdBn);

                setShowModal(false);

                fireToast('success', 'You have successfully reclaimed your subscription');
            }

            if (areAdressesEqual(address, user)) {
                await refreshTokenStates(contract, tokenIdBn);

                setShowModal(false);

                fireToast('success', 'You have successfully borrowed this subscription');

            }
        }

        const rentOfferCreatedHandler = async (eventTokenId: BigNumber) => {
            const tokenIdBn = BigNumber.from(tokenId);

            if (!tokenIdBn.eq(eventTokenId)) {
                return;
            }

            if (!areAdressesEqual(address, String(owner))) {
                return;
            }

            await refreshTokenStates(contract, tokenIdBn);
            await getRentingConditions(contract, tokenIdBn);

            setShowModal(false);

            fireToast('success', 'You have successfully created a renting offer');
        }

        const rentOfferCancelledHandler = async (eventTokenId: BigNumber) => {
            const tokenIdBn = BigNumber.from(tokenId);

            if (!tokenIdBn.eq(eventTokenId)) {
                return;
            }

            if (!areAdressesEqual(address, String(owner))) {
                return;
            }

            await refreshTokenStates(contract, tokenIdBn);

            setShowModal(false);

            fireToast('success', 'You have successfully cancelled your renting offer');
        }

        contract.on('UpdateUser', updateUserHandler);

        contract.on('RentOfferCreated', rentOfferCreatedHandler);

        contract.on('RentOfferCancelled', rentOfferCancelledHandler);

        return (() => {
            contract.off('UpdateUser', updateUserHandler);

            contract.off('RentOfferCreated', rentOfferCreatedHandler);

            contract.off('RentOfferCancelled', rentOfferCancelledHandler);
        })
    }, [contracts, platform, tokenId, address, owner]);

    const refreshTokenStates = useCallback(async (contract: Contract, tokenId: BigNumber) => {
        setIsRentable(await isTokenRentable(contract, tokenId, address));

        setIsBorrowable(await isTokenBorrowable(contract, tokenId, address));

        setIsReclaimable(await isTokenReclaimable(contract, tokenId, address));

        setIsOfferCancellable(await isTokenOfferCancellable(contract, tokenId, address));
    }, [address]);

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

    const cancelOfferForRent = useCallback(async () => {
        if (!isOfferCancellable) {
            return;
        }

        if (!contracts) {
            return;
        }

        await cancelOffer(contracts[platform as ServiceName].contract, BigNumber.from(tokenId));

        setShowModal(true);
    }, [isOfferCancellable, contracts, tokenId]);

    const reclaim = useCallback(async () => {
        if (!isReclaimable) {
            return;
        }

        if (!contracts) {
            return;
        }

        await reclaimToken(contracts[platform as ServiceName].contract, BigNumber.from(tokenId));

        setShowModal(true);
    }, [isReclaimable, contracts, tokenId, platform])

    const borrow = useCallback(async () => {
        if (!contracts) {
            return;
        }

        if (!provider) {
            return;
        }

        await rentToken(contracts[platform as ServiceName].contract, provider, BigNumber.from(tokenId));

        setShowModal(true);
    }, [contracts, provider])

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
                        {!areAdressesEqual(borrower, ethers.constants.AddressZero) &&
                            <p>
                                Borrower: {borrower} {areAdressesEqual(borrower, address) &&  <span> (you)</span>}
                            </p>
                        }

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

                        {isOfferCancellable &&
                            <div>
                                <button className="btn btn-danger" onClick={cancelOfferForRent}>Cancel offer</button>
                            </div>
                        }

                        {isBorrowable &&
                            <div>
                                <h3>Borrow subscription</h3>
                                <div>
                                    <span>{`Price: ${rentingConditions!.price / 100}$`}</span>
                                    <span className="ms-2">{`Duration: ${rentingConditions!.duration}s`}</span>
                                </div>
                                <div className="mt-2">
                                    <button className="btn btn-primary" onClick={borrow}>Borrow</button>
                                </div>
                            </div>
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
