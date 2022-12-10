import {AvailableToken} from "./OpenSubsGallery";
import {Link} from "react-router-dom";

interface GalleryCardProps {
    token: AvailableToken;
    isOwner: boolean,
}

function GalleryTokenCard({token, isOwner}: GalleryCardProps) {
    return (
        <div className="card">
            <div className="img-container" style={{
                backgroundColor: token.metadata.background_color,
            }}>
                <img src={token.metadata.image} alt="Logo"/>
            </div>

            <div className="card-body">
                <h5 className="card-title">
                    <>
                        {token.service}#{token.tokenId.toString()}

                        {isOwner &&
                        <span> - Your offer</span>
                        }
                    </>
                </h5>

                <p>{token.metadata.description}</p>

                <p>
                    <>
                        {token.rentingConditions.price / 100}$ for {token.rentingConditions.duration.toString()}s
                    </>
                </p>
            </div>
            <div className="card-footer">
                <Link to={`/opensubs/token/${token.service}/${token.tokenId}`} className="btn">
                    View
                </Link>
            </div>
        </div>
    );
}

export default GalleryTokenCard;
