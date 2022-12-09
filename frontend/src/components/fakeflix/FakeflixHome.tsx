import FakeflixContent from "./FakeflixContent";
import {fakeflixAppContext} from "../FakeflixApp";
import {useContext} from "react";
import {Link} from "react-router-dom";

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
                <p>Please <Link to="mint">subscribe</Link> to access content</p>
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
