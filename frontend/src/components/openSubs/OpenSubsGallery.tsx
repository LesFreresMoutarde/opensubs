import {useCallback, useContext, useEffect, useMemo, useState} from "react";
import {openSubsAppContext, ServiceName} from "../OpenSubsApp";
import {BigNumber} from "ethers";
import {
    getRentingConditions,
    isTokenBorrowable,
    RentingConditions
} from "../../utils/SubscriptionUtil";
import {getMetadataUrl, SubscriptionMetadata} from "../../utils/Util";
import GalleryTokenCard from "./GalleryTokenCard";

export type AvailableToken = {
    service: ServiceName,
    tokenId: BigNumber,
    metadata: SubscriptionMetadata,
    isBorrowable: boolean,
    rentingConditions: RentingConditions,
}

export type AvailableTokensPerPlatform = {
    [key in ServiceName]: AvailableToken[];
}

type DisplayPlatform = ServiceName | "all";

function OpenSubsGallery() {

    const {address, contracts} = useContext(openSubsAppContext)

    const [isLoading, setIsLoading] = useState(true);

    const [availableTokens, setAvailableTokens] = useState<AvailableTokensPerPlatform | null>(null);

    const [displayPlatform, setDisplayPlatform] = useState<DisplayPlatform>("all");

    const fetchAvailableTokens = useCallback(async (platform: ServiceName) => {
        if (!contracts) {
            return;
        }

        if (!address) {
            return;
        }

        const contract = contracts[platform].contract;

        const availableTokenCount = await contract.getAvailableTokenCount();

        const availableTokensForPlatform: AvailableToken[] = [];

        for (let i = 0; i < availableTokenCount; ++i) {
            const tokenId = await contract.getAvailableTokenIdAtIndex(i);

            const isBorrowable = await isTokenBorrowable(contract, tokenId, address);

            const rentingConditions = await getRentingConditions(contract, tokenId);

            const metadataUrl = await getMetadataUrl(tokenId, platform);
            const metadata = await (await fetch(metadataUrl)).json()

            availableTokensForPlatform.push({
                service: platform,
                tokenId,
                metadata,
                isBorrowable,
                rentingConditions,
            });
        }

        return availableTokensForPlatform;
    }, [contracts, address]);

    useEffect(() => {
        if (!contracts) {
            return;
        }

        if (!address) {
            return;
        }

        (async () => {
            const availableTokens: Partial<AvailableTokensPerPlatform> = {};

            for (const platform in contracts) {
                availableTokens[platform as ServiceName] = await fetchAvailableTokens(platform as ServiceName);
            }

            setAvailableTokens(availableTokens as AvailableTokensPerPlatform);
            setIsLoading(false);
        })();
    }, [contracts, address]);

    const displayedAvailableTokens = useMemo<AvailableToken[]>(() => {
        if (!availableTokens) {
            return [];
        }

        const displayedAvailableTokens: AvailableToken[] = [];

        if (displayPlatform === "all") {
            for (const platform in availableTokens) {
                displayedAvailableTokens.push(...availableTokens[platform as ServiceName]);
            }
        } else {
            displayedAvailableTokens.push(...availableTokens[displayPlatform]);
        }

        displayedAvailableTokens.sort((tokenA, tokenB) => {
            if (tokenA.rentingConditions.createdAt > tokenB.rentingConditions.createdAt) {
                return 1;
            }

            if (tokenA.rentingConditions.createdAt < tokenB.rentingConditions.createdAt) {
                return -1;
            }

            return 0;
        });

        return displayedAvailableTokens;
    }, [availableTokens, displayPlatform]);

    return (
        <div className="gallery-page container-fluid">
            <div className="row">
                <div className="col-xl-2 col-lg-3">
                    <div className="filters-container">
                        <div>
                            <button className={`btn ${displayPlatform === "all" ? "active" : ""}`}
                                    onClick={() => setDisplayPlatform("all")}
                            >
                                All
                            </button>
                        </div>
                        <div>
                            <button className={`btn ${displayPlatform === "fakeflix" ? "active" : ""}`}
                                    onClick={() => setDisplayPlatform("fakeflix")}
                            >
                                Fakeflix
                            </button>
                        </div>
                        <div>
                            <button className={`btn ${displayPlatform === "spooftify" ? "active" : ""}`}
                                    onClick={() => setDisplayPlatform("spooftify")}
                            >
                                Spooftify
                            </button>
                        </div>
                    </div>
                </div>

                <div className="col-xl-10 col-lg-9">
                    <h2>Subscriptions available for renting</h2>

                    {isLoading &&
                    <p>Loading...</p>
                    }

                    {!isLoading &&
                    <>
                        {displayedAvailableTokens.length === 0 &&
                        <p>No subscription is available for renting now</p>
                        }

                        <div className="token-cards-container">
                            {displayedAvailableTokens.map((token, index) => {
                                return (
                                    <GalleryTokenCard key={index} token={token} isOwner={!token.isBorrowable}/>
                                );
                            })}
                        </div>
                    </>
                    }
                </div>
            </div>
        </div>
    );
}

export default OpenSubsGallery
