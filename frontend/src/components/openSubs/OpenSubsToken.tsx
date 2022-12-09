import {useParams} from "react-router-dom";

function OpenSubsToken() {
    const {platform, tokenId} = useParams();

    return (
        <p>Token details {platform} {tokenId}</p>
    );
}

export default OpenSubsToken;
