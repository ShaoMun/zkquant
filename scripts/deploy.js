const hre = require("hardhat");

async function main() {
  const MasterModelMetadata = await hre.ethers.getContractFactory("MasterModelMetadata");
  const contract = await MasterModelMetadata.deploy();
  await contract.waitForDeployment();
  console.log("MasterModelMetadata deployed to:", contract.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 