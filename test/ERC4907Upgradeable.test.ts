import {ethers, upgrades} from "hardhat";
import {ERC4907Upgradeable} from "../typechain-types";
import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {Contract} from "ethers";

describe("Voting smart contract test", () => {

    async function deployERC4907Fixture() {
        const ERC4907EnumerableFactory = await ethers.getContractFactory("ERC4907Upgradeable");

        const erc4907Enumerable: Contract = await upgrades.deployProxy(
            ERC4907EnumerableFactory,
            ["Fakeflix", "FLX"],
            { initializer: '__ERC4907_init', kind: 'transparent'}
        );

        await erc4907Enumerable.deployed();

        return erc4907Enumerable;
    }

    it('test deploy', async () => {
        const contract = await loadFixture(deployERC4907Fixture);

        console.log(contract);
    })
});
