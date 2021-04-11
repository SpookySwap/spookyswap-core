const HDWalletProvider = require("truffle-hdwallet-provider");

require('dotenv').config();  // Store environment-specific variable from '.env' to process.env

module.exports = {
  contracts_build_directory: "./build",
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*"
    },
    fantom: {
      provider: () => new HDWalletProvider(process.env.MNEMONIC, "https://rpcapi.fantom.network"),
      network_id: 250,
      gasPrice: 22000000000,
      timeoutBlocks: 200,
      skipDryRun: true
    },
    fantomtest: {
      provider: () => new HDWalletProvider(process.env.MNEMONIC, "https://rpc.testnet.fantom.network"),
      network_id: 4002,
      gasPrice: 22000000000,
      timeoutBlocks: 200,
      skipDryRun: true
    },
    mainnet: {
      provider: () => new HDWalletProvider(process.env.MNEMONIC, "https://mainnet.infura.io/v3/" + process.env.INFURA_API_KEY),
      port: 8545,
      network_id: 1,
      gas: 6000000,
      gasPrice: 4000000000
    },
    rinkeby: {
      provider: () => new HDWalletProvider(process.env.MNEMONIC, "https://rinkeby.infura.io/v3/" + process.env.INFURA_API_KEY),
      port: 8545,
      network_id: 4,
      gas: 6000000,
      gasPrice: 40000000000
    },
    ropsten: {
      provider: () => new HDWalletProvider(process.env.MNEMONIC, "https://ropsten.infura.io/v3/" + process.env.INFURA_API_KEY),
      port: 8545,
      network_id: 3,
      gas: 6000000,
      gasPrice: 40000000000
    },
    coverage: {
      host: "localhost",
      network_id: "*",
      port: 8545,        
      gas: 0xfffffffffff, 
      gasPrice: 0x01     
    },
  },
  compilers: {
    solc: {
      version: "0.6.12",
      settings: {
        optimizer: {
          enabled: true,
          runs: 999999   // Optimize for how many times you intend to run the code
        }
      }
    }    
  }
};