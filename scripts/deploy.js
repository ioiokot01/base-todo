const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const Factory = await hre.ethers.getContractFactory("TodoList");
  const todo = await Factory.deploy();
  await todo.waitForDeployment();

  const address = await todo.getAddress();
  console.log("TodoList deployed to:", address);
  console.log("Explorer:", `https://sepolia.basescan.org/address/${address}`);
  console.log("\nUpdate frontend/app.js -> CONTRACT_ADDRESS with this address.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
