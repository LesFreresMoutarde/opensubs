import {Link} from "react-router-dom";
import {Token, TokenStatus} from "./OpenSubsMyTokens";

interface MyTokensTokenCardProps {
    token: Token;
    status: TokenStatus
}

function MyTokensTokenCard({token, status}: MyTokensTokenCardProps) {
    return (
        <div className="card">
            <img src="toto" alt="Logo" className="card-img-top"/>

            <div className="card-body">
                <h5 className="card-title">
                    {`${token.service}#${token.tokenId} (${status})`}
                </h5>

                <p>Toto del tototi della totota del tototutu</p>

                <Link to={`/opensubs/${token.service}/${token.tokenId}`} className="btn">
                    View
                </Link>
            </div>
        </div>
    );
}

export default MyTokensTokenCard;
