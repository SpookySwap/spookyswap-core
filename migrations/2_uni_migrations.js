const UniswapV2Factory = artifacts.require("UniswapV2Factory");

module.exports = function (deployer, network, accounts) {
  deployer.deploy(UniswapV2Factory, accounts[0]);
}; 
