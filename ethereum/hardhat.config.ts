import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";

const dotenv = require("dotenv");

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  defaultNetwork: "localhost",
  paths: {
    artifacts: "../frontend/src/artifacts"
  },
  networks: {
    hardhat: {
      forking: {
        url: `https://goerli.infura.io/v3/${process.env.INFURA_KEY}`
      },
  /* Uncomment the line below if metamask fix has to be done in hardhat */
  //     chainId: 1337
    },
    // goerli: {
    //   url: "",
    //   accounts: {
    //     mnemonic: process.env.MNEMONIC
    //   }
    // }
  }
};

export default config;
