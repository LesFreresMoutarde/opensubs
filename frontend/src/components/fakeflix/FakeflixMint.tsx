import {useCallback, useContext, useEffect, useState} from "react";
import {getSubscriptionPrice, mintToken} from "../../utils/SubscriptionUtil";
import {fakeflixAppContext} from "../FakeflixApp";
import LoadingModal from "../common/LoadingModal";
import {fireToast, getMetadataUrl, pushMetadata} from "../../utils/Util";
import {ethers} from "ethers";

function FakeflixMint() {

    const {subscription, provider, address} = useContext(fakeflixAppContext);

    const [showModal, setShowModal] = useState<boolean>(false);

    const [subscriptionPrice, setSubscriptionPrice] = useState(0);

    useEffect(() => {
        if (!subscription) {
            return;
        }

        (async () => {
            setSubscriptionPrice(await getSubscriptionPrice(subscription));
        })();
    }, [subscription, address]);

    useEffect(() => {
        if (!subscription) {
            return;
        }

        const transferHandler = async (from: string, to: string, tokenId: number) => {
            if (to === ethers.utils.getAddress(address)) {
                setShowModal(false);

                fireToast('success', 'You have successfully minted a subscription NFT');

                try {
                    await getMetadataUrl(tokenId, 'fakeflix');
                } catch (error) {
                    await pushMetadata(tokenId, 'fakeflix');
                }
            }
        }

        subscription.on('Transfer', transferHandler);

        return () => {
            subscription.off('Transfer', transferHandler);
        }
    }, [subscription, address]);

    const mint = useCallback(async () => {
        if (!subscription) {
            return;
        }

        await mintToken(subscription, provider!);

        setShowModal(true);
    }, [subscription, provider]);

    const closeModal = useCallback(() => {
        setShowModal(false);
    }, [])

    return (
        <div className="mint-page">
            {showModal && <LoadingModal showModal={showModal} closeModal={closeModal}/>}

            {!address &&
            <div className="text">
                <h2>Connect wallet to mint a subscription</h2>
            </div>
            }

            {address &&
            <>
                <div className="text">
                    <h1>Unlimited movies, series and much more.</h1>
                    <p>Wherever you are. Cancel at any time. Only {subscriptionPrice / 100}$ for 30 days</p>
                </div>
                <div className="mint-button-container">
                    <button onClick={mint}>Subscribe</button>
                </div>
            </>
            }
        </div>
    );
}

export default FakeflixMint;
