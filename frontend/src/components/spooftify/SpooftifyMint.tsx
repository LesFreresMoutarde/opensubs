import {useCallback, useContext, useEffect, useState} from "react";
import {ethers} from "ethers";
import {fireToast, getMetadata, pushMetadata} from "../../utils/Util";
import {mintToken} from "../../utils/SubscriptionUtil";
import LoadingModal from "../common/LoadingModal";
import {spooftifyAppContext} from "../SpooftifyApp";

function SpooftifyMint() {

    const {subscription, provider, address} = useContext(spooftifyAppContext);

    const [showModal, setShowModal] = useState<boolean>(false);

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
    }, [subscription]);

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
        <>
            {showModal && <LoadingModal showModal={showModal} closeModal={closeModal}/>}
            <p>Spooftify mint</p>
            <button onClick={mint}>Mint</button>
        </>
    );
}

export default SpooftifyMint;
