import {useContext} from "react";
import {spooftifyAppContext} from "../SpooftifyApp";
import SpooftifyContent from "./SpooftifyContent";

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
                <p>You are not authorized to access content</p>
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
