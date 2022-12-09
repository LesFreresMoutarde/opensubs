import {useCallback, useContext, useEffect, useState} from "react";
import {mintToken} from "../../utils/SubscriptionUtil";
import {fakeflixAppContext} from "../FakeflixApp";
import LoadingModal from "../common/LoadingModal";
import {fireToast, getMetadata, pushMetadata} from "../../utils/Util";
import {ethers} from "ethers";

function FakeflixMint() {

    const {subscription, provider, address} = useContext(fakeflixAppContext);

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
                    await getMetadata(tokenId, 'fakeflix');
                } catch (error) {
                    await pushMetadata(tokenId, 'fakeflix');
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
            <p>Fakeflix mint</p>
            <button onClick={mint}>Mint</button>
        </>
    );
}

export default FakeflixMint;
