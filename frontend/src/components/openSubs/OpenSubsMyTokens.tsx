import {useCallback, useContext, useEffect, useState} from "react";
import {openSubsAppContext, ServiceName} from "../OpenSubsApp";
import {
    getBalanceOfOwnedTokens,
    getBalanceOfUsedTokens,
    getOwnedTokensByUser,
    getUsedTokensByUser,
    getUserEtherBalance,
    isRentingExpired,
    isTokenOfferCancellable,
    isTokenReclaimable,
    isTokenRentable, withdrawEther
} from "../../utils/SubscriptionUtil";
import {BigNumber, ethers} from "ethers";
import MyTokensTokenCard from "./MyTokensTokenCard";
import {areAdressesEqual, fireToast, getMetadataUrl, SubscriptionMetadata} from "../../utils/Util";
import OpenSubsConfirmationWithdrawModal from "./OpenSubsConfirmationWithdrawModal";
import LoadingModal from "../common/LoadingModal";

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

type EtherBalance = {
    [key in ServiceName]: BigNumber;
};

type EtherBalanceWithTotal = EtherBalance & {total: BigNumber};

function OpenSubsMyTokens() {
    const {address, contracts} = useContext(openSubsAppContext)

    const [ownedTokens, setOwnedTokens] = useState<Token[]>([]);
    const [usedTokens, setUsedTokens] = useState<Token[]>([]);

    const [displayCategory, setDisplayCategory] = useState<DisplayCategory>("owned");

    const [etherBalance, setEtherBalance] = useState<EtherBalanceWithTotal | null>(null);
    const [showConfirmationWithdrawModal, setShowConfirmationWithdrawModal] = useState(false);
    const [showWithdrawButton, setShowWithdrawButton] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);

    useEffect(() => {
        if (address === '') {
            return;
        }

        if (!contracts) {
            return;
        }

        (async () => {
            const balances: any = {};
            const tokenIds: any = {};
            const etherBalance: any = {};

            for (const [serviceName, contractDescription] of Object.entries(contracts)) {
                etherBalance[serviceName] = await getUserEtherBalance(contractDescription.contract, address);

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

            let total = BigNumber.from(0);

            for (const service in etherBalance) {
                total = total.add(etherBalance[service]);
            }

            etherBalance.total = total;

            if (total.gt(0)) {
                setShowWithdrawButton(true);
            }
            setEtherBalance(etherBalance);
            setOwnedTokens(ownedTokens);
            setUsedTokens(usedTokens);
        })();
    }, [address, contracts, showWithdrawModal]);

    const withdrawHandler = useCallback((eventAddress: string, service: string) => {
        if (!address) {
            return;
        }

        if (!areAdressesEqual(address, eventAddress)) {
            return;
        }

        setShowWithdrawModal(false);

        setShowWithdrawButton(false);

        setEtherBalance({fakeflix: BigNumber.from(0), spooftify: BigNumber.from(0), total: BigNumber.from(0)});

        fireToast('success', `You have successfully withdrawn your funds on ${service}`);
    }, [address]);

    const closeLoadingModal = useCallback(() => {
        setShowWithdrawModal(false);
    }, [showWithdrawModal])

    useEffect(() => {
        if (!contracts) {
            return;
        }

        for (const [serviceName, contractDescription] of Object.entries(contracts)) {
            contractDescription.contract.on('Withdraw', withdrawHandler)
        }

        return () => {
            for (const [serviceName, contractDescription] of Object.entries(contracts)) {
                contractDescription.contract.on('Withdraw', withdrawHandler)
            }
        }
    }, [contracts, withdrawHandler]);

    const showConfirmationModal = useCallback(() => {
        setShowConfirmationWithdrawModal(true);
    }, [])

    const withdraw = useCallback(async () => {
        if (!contracts) {
            return;
        }

        if (!etherBalance) {
            return;
        }

        for (const [serviceName, contractDescription] of Object.entries(contracts)) {
            console.log("contractDesc", contractDescription);

            console.log("balance, service", etherBalance[serviceName as ServiceName], serviceName);

            if (etherBalance[serviceName as ServiceName].gt(0)) {
                await withdrawEther(contractDescription.contract);
            }
        }

        setShowConfirmationWithdrawModal(false);
        setShowWithdrawModal(true);
    }, [contracts, etherBalance])


    return (
        <div className="my-tokens-page container-fluid">
            {showConfirmationWithdrawModal &&
                <OpenSubsConfirmationWithdrawModal
                    showModal={showConfirmationWithdrawModal}
                    closeModal={() => setShowConfirmationWithdrawModal(false)}
                    withdraw={withdraw}
                />
            }
            {showWithdrawModal &&
                <LoadingModal showModal={showWithdrawModal} closeModal={closeLoadingModal}/>
            }
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
                        {showWithdrawButton &&
                            <div className="mt-3">
                                <p>{`Balance: ${ethers.utils.formatEther(etherBalance!.total).slice(0,7)} ETH`}</p>
                                <button className="btn btn-primary" onClick={showConfirmationModal}>Withdraw</button>
                            </div>
                        }
                    </div>
                </div>
                <div className="col-xl-10 col-lg-9">
                    {displayCategory === "owned" &&
                    <>
                        <h2 className="mb-4">Owned</h2>

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
