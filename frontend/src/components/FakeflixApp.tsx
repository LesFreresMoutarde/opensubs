import {useEffect, useState} from "react";
import {providers} from "ethers";

function FakeflixApp() {

    const [provider, setProvider] = useState<providers.Web3Provider | null | undefined>(undefined);

    useEffect(() => {
        if (window.ethereum) {
            setProvider(new providers.Web3Provider(window.ethereum));
        } else {
            //TODO Display div "you need metamask"
            setProvider(null);
        }
    }, []);

    return (
        <p>Fakeflix ! tudum</p>
    )
}

export default FakeflixApp;
