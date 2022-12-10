import {useContext, useEffect} from "react";
import {openSubsAppContext} from "../OpenSubsApp";

function OpenSubsGallery() {

    const {contracts} = useContext(openSubsAppContext)

    useEffect(() => {
        // Fetch all tokens from getAvailableTokenCount() and getAvailableTokenIdAtIndex(uint256 index) per platform (contracts)
        // Sort per createdAt
    }, []);

    return (
        <p>Gallery</p>
    );
}

export default OpenSubsGallery
