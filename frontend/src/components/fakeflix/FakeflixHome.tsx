import FakeflixContent from "./FakeflixContent";
import {fakeflixAppContext} from "../FakeflixApp";
import {useContext} from "react";

function FakeflixHome() {
    const {address, isContentAvailable} = useContext(fakeflixAppContext);

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
                <FakeflixContent/>
                }
            </>
            }
        </div>
    );
}

export default FakeflixHome;
