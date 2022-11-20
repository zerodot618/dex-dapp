const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });
const { ZERODOT618_TOKEN_CONTRACT_ADDRESS } = require("../constants");

async function main() {
  const cryptoDevTokenAddress = ZERODOT618_TOKEN_CONTRACT_ADDRESS;
  // 合约实例
  const exchangeContract = await ethers.getContractFactory("Exchange");

  // 部署合约
  const deployedExchangeContract = await exchangeContract.deploy(
    cryptoDevTokenAddress
  );
  // 等待部署完成
  await deployedExchangeContract.deployed();

  // 打印合约地址
  console.log("Exchange Contract Address:", deployedExchangeContract.address);
}

// 调用 main 函数并捕捉错误
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });