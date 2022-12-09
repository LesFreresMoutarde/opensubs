function shortenAddress(address: string, firstCharactersCount: number = 3, lastCharactersCount: number = 3): string {
    if (!address.startsWith("0x")) {
        return address;
    }

    const firstCharacters = address.slice(0, firstCharactersCount + 2);
    const lastCharacters = address.slice(lastCharactersCount * -1);

    return firstCharacters + "…" + lastCharacters;
}

export {shortenAddress}
