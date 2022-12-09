import {useContext} from "react";
import {spooftifyAppContext} from "../SpooftifyApp";
import SpooftifyContent from "./SpooftifyContent";
import {Link} from "react-router-dom";

function SpooftifyHome() {
    const {address, isContentAvailable} = useContext(spooftifyAppContext);

    return (
        <div>
            {address &&
            <>
                {isContentAvailable === null &&
                <p>Verifying your tokens...</p>
                }

                {isContentAvailable === false &&
                <div className="please-subscribe">
                    <p>Please <Link to="mint">subscribe</Link> to access content</p>
                </div>
                }

                {isContentAvailable === true &&
                <SpooftifyContent/>
                }
            </>
            }
        </div>
    );
}

export default SpooftifyHome;
