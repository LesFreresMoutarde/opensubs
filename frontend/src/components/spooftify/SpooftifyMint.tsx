import {useCallback, useContext, useEffect, useState} from "react";
import {ethers} from "ethers";
import {fireToast, getMetadata, pushMetadata} from "../../utils/Util";
import {getSubscriptionPrice, mintToken} from "../../utils/SubscriptionUtil";
import LoadingModal from "../common/LoadingModal";
import {spooftifyAppContext} from "../SpooftifyApp";

function SpooftifyMint() {

    const {subscription, provider, address} = useContext(spooftifyAppContext);

    const [showModal, setShowModal] = useState<boolean>(false);

    const [subscriptionPrice, setSubscriptionPrice] = useState(0);

    useEffect(() => {
        if (!subscription) {
            return;
        }

        (async () => {
            setSubscriptionPrice(await getSubscriptionPrice(subscription));
        })();
    }, [subscription]);

    useEffect(() => {
        if (!subscription) {
            return;
        }

        subscription.on('Transfer', async (from, to, tokenId) => {
            if (to === ethers.utils.getAddress(address)) {
                setShowModal(false);

                fireToast('success', 'You have successfully minted a subscription NFT');

                try {
                    await getMetadata(tokenId, 'spooftify');
                } catch (error) {
                    await pushMetadata(tokenId, 'spooftify');
                }
            }
        });
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
            <div className="text">
                <h1>Enjoy ad-free music listening, offline playback, and more.</h1>
                <p>Cancel anytime. Only {subscriptionPrice / 100}$ for 30 days</p>
            </div>
            <div className="mint-button-container">
                <button onClick={mint}>Subscribe</button>
            </div>
        </div>
    );
}

export default SpooftifyMint;
