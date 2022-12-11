import {useContext, useEffect, useState} from "react";
import {openSubsAppContext, ServiceName} from "../OpenSubsApp";
import {
    getBalanceOfOwnedTokens,
    getBalanceOfUsedTokens,
    getOwnedTokensByUser,
    getUsedTokensByUser, isRentingExpired, isTokenOfferCancellable, isTokenReclaimable, isTokenRentable
} from "../../utils/SubscriptionUtil";
import {BigNumber} from "ethers";
import MyTokensTokenCard from "./MyTokensTokenCard";
import {getMetadataUrl, SubscriptionMetadata} from "../../utils/Util";

export type Token = {
    tokenId: BigNumber,
    metadata: SubscriptionMetadata,
    isRentable: boolean,
    isReclaimable: boolean,
    isOfferCancellable: boolean,
    service: ServiceName,
};

export type TokenStatus = "owned" | "rented" | "reclaimable" | "offeredForRent" | "borrowed";

type DisplayCategory = "owned" | "borrowed";

function OpenSubsMyTokens() {
    const {address, contracts} = useContext(openSubsAppContext)

    const [ownedTokens, setOwnedTokens] = useState<Token[]>([]);
    const [usedTokens, setUsedTokens] = useState<Token[]>([]);

    const [displayCategory, setDisplayCategory] = useState<DisplayCategory>("owned");

    useEffect(() => {
        if (address === '') {
            return;
        }

        if (contracts) {
            (async () => {
                const balances: any = {};
                const tokenIds: any = {};

                for (const [serviceName, contractDescription] of Object.entries(contracts)) {
                    balances[serviceName] = {owned: [], used: []};
                    tokenIds[serviceName]= {owned: [], used: []};

                    balances[serviceName].owned = await getBalanceOfOwnedTokens(contractDescription.contract, address);
                    tokenIds[serviceName].owned = await getOwnedTokensByUser(
                        contractDescription.contract,
                        address,
                        balances[serviceName].owned.toBigInt()
                    );

                    balances[serviceName].used = await getBalanceOfUsedTokens(contractDescription.contract, address);
                    tokenIds[serviceName].used = await getUsedTokensByUser(
                        contractDescription.contract,
                        address,
                        balances[serviceName].used.toBigInt()
                    );
                }

                const ownedTokens: Token[] = [];
                const usedTokens: Token[] = [];

                for (const serviceName in tokenIds) {
                    for (const [type, tokens] of Object.entries<any>(tokenIds[serviceName])) {
                        if (tokens.length > 0) {
                            for (const tokenId of tokens) {
                                if (type === "used") {
                                    if (await isRentingExpired(contracts[serviceName as ServiceName].contract, tokenId)) {
                                        continue;
                                    }
                                }

                                const metadataUrl = await getMetadataUrl(tokenId, serviceName as ServiceName);
                                const metadata = await (await fetch(metadataUrl)).json()

                                const isRentable = await isTokenRentable(contracts[serviceName as ServiceName].contract, tokenId, address);
                                const isReclaimable = await isTokenReclaimable(contracts[serviceName as ServiceName].contract, tokenId, address);
                                const isOfferCancellable = await isTokenOfferCancellable(contracts[serviceName as ServiceName].contract, tokenId, address);

                                const token: Token = {
                                    tokenId,
                                    metadata,
                                    isRentable,
                                    isReclaimable,
                                    isOfferCancellable,
                                    service: serviceName as ServiceName,
                                }

                                if (type === "owned") {
                                    ownedTokens.push(token);
                                } else {
                                    usedTokens.push(token)
                                }
                            }
                        }
                    }
                }

                setOwnedTokens(ownedTokens);
                setUsedTokens(usedTokens);
            })();
        }
    }, [address, contracts]);

    return (
        <div className="my-tokens-page container-fluid">
            <div className="row">
                <div className="col-xl-2 col-lg-3">
                    <div className="filters-container">
                        <div>
                            <button className={`btn ${displayCategory === "owned" ? "active" : ""}`}
                                    onClick={() => setDisplayCategory("owned")}
                            >
                                My tokens
                            </button>
                        </div>
                        <div>
                            <button className={`btn ${displayCategory === "borrowed" ? "active" : ""}`}
                                    onClick={() => setDisplayCategory("borrowed")}
                            >
                                Borrowed tokens
                            </button>
                        </div>
                    </div>
                </div>
                <div className="col-xl-10 col-lg-9">
                    {displayCategory === "owned" &&
                    <>
                        <h2 className="mb-4">Owned</h2>

                        {ownedTokens.length === 0 &&
                        <p>You don't have any subscription</p>
                        }

                        <div className="token-cards-container">
                            {ownedTokens.map((token, index) => {
                                const status: TokenStatus = ((): TokenStatus => {
                                    if (token.isReclaimable) {
                                        return "reclaimable";
                                    }

                                    if (token.isRentable) {
                                        return "owned";
                                    }

                                    if (token.isOfferCancellable) {
                                        return "offeredForRent";
                                    }

                                    return "rented";
                                })();

                                return (
                                    <MyTokensTokenCard token={token} status={status} key={index}/>
                                );
                            })}
                        </div>
                    </>
                    }

                    {displayCategory === "borrowed" &&
                    <>
                        <h2 className="mb-4">Borrowed</h2>

                        {usedTokens.length === 0 &&
                        <p>You are not borrowing any subscription</p>
                        }

                        <div className="token-cards-container">
                            {usedTokens.map((token, index) => {
                                return (
                                    <MyTokensTokenCard token={token} status={"borrowed"} key={index}/>
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

export default OpenSubsMyTokens;
