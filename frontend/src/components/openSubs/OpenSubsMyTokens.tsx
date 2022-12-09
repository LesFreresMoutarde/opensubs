import {useContext, useEffect, useState} from "react";
import {openSubsAppContext, ServiceName} from "../OpenSubsApp";
import {
    getBalanceOfOwnedTokens,
    getBalanceOfUsedTokens,
    getOwnedTokensByUser,
    getUsedTokensByUser, isTokenReclaimable, isTokenRentable
} from "../../utils/SubscriptionUtil";
import {BigNumber} from "ethers";

type Token = {
    tokenId: BigNumber,
    isRentable: boolean,
    isReclaimable: boolean,
    service: ServiceName,
};

function OpenSubsMyTokens() {
    const {address, contracts} = useContext(openSubsAppContext)

    const [ownedTokens, setOwnedTokens] = useState<Token[]>([]);
    const [usedTokens, setUsedTokens] = useState<Token[]>([]);

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
                                const isRentable = await isTokenRentable(contracts[serviceName as ServiceName].contract, tokenId, address);
                                const isReclaimable = await isTokenReclaimable(contracts[serviceName as ServiceName].contract, tokenId, address);

                                const toto: Token = {
                                    tokenId,
                                    isRentable,
                                    isReclaimable,
                                    service: serviceName as ServiceName,
                                }

                                if (type === "owned") {
                                    ownedTokens.push(toto);
                                } else {
                                    usedTokens.push(toto)
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

    console.log("owned", ownedTokens);
    console.log("used", usedTokens);


    return (
        <div className="my-tokens-page">
            <h2>Owned</h2>

            <ul>
                {ownedTokens.map((token, index) => {
                    const status: TokenStatus = ((): TokenStatus => {
                        if (token.isReclaimable) {
                            return "reclaimable";
                        }

                        if (token.isRentable) {
                            return "owned";
                        }

                        return "rented";
                    })();

                    return (
                        <li key={index}>{`${token.service}#${token.tokenId} (${status})`}</li>
                    );
                })}
            </ul>


            <h2>Borrowed</h2>

            <ul>
                {usedTokens.map((token, index) => {
                    const status: TokenStatus = "borrowed";

                    return (
                        <li key={index}>{`${token.service}#${token.tokenId} (${status})`}</li>
                    );
                })}
            </ul>
        </div>
    );
}

export default OpenSubsMyTokens;
