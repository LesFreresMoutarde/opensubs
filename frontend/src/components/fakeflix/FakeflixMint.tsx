import {useCallback, useContext, useEffect, useState} from "react";
import {mintToken} from "../../utils/SubscriptionUtil";
import {fakeflixAppContext} from "../FakeflixApp";
import LoadingModal from "../common/LoadingModal";
import {fireToast} from "../../utils/Util";
import {ethers} from "ethers";

function FakeflixMint() {

    const {subscription, provider, address} = useContext(fakeflixAppContext);

    const [showModal, setShowModal] = useState<boolean>(false);

    useEffect(() => {
        if (!subscription) {
            return;
        }

        subscription.on('Transfer', (from, to, tokenId) => {
            console.log("from, to, tokenId", from, to ,tokenId);
            console.log(address);

            if (to === ethers.utils.getAddress(address)) {
                setShowModal(false);

                fireToast('success', 'You have successfully minted a subscription NFT');

                console.log("push metadata")
            }
        });
    }, [subscription]);

    return (
        <p>Fakeflix mint</p>
    );
}

export default FakeflixMint;
