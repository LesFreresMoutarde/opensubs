import {Link} from "react-router-dom";
import {Token, TokenStatus} from "./OpenSubsMyTokens";

interface MyTokensTokenCardProps {
    token: Token;
    status: TokenStatus
}

function MyTokensTokenCard({token, status}: MyTokensTokenCardProps) {
    return (
        <div className="card">
            <div className="img-container">
                <img src={token.metadata.image} alt="Logo"/>
            </div>

            <div className="card-body">
                <h5 className="card-title">
                    {`${token.service}#${token.tokenId} (${status})`}
                </h5>

                <p>{token.metadata.description}</p>
            </div>
            <div className="card-footer">
                <Link to={`/opensubs/token/${token.service}/${token.tokenId}`} className="btn">
                    View
                </Link>
            </div>
        </div>
    );
}

export default MyTokensTokenCard;
