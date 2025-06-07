require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    xrplEVM: {
      url: process.env.XRPL_EVM_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
}; 