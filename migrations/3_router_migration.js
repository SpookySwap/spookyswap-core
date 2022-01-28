const UniswapV2Router02 = artifacts.require("UniswapV2Router02");

const WFTMtestnet = "0xf1277d1ed8ad466beddf92ef448a132661956621";
const WFTM = "0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83";
const FactoryAddress = "0x152eE697f2E276fA89E96742e9bB9aB1F2E61bE3";

module.exports = function (deployer) {
    deployer.deploy(UniswapV2Router02, FactoryAddress, WFTM);
  }; 
  