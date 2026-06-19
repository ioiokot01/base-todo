const hre = require("hardhat");

// Deployed TodoList on Base Sepolia.
const ADDRESS = "0xe89b6312DB066C3E5Ae5B507d94f135Fd2D4259f";

async function main() {
  const todo = await hre.ethers.getContractAt("TodoList", ADDRESS);

  // Tasks are per-wallet, so read for the configured account (or override here).
  const [account] = await hre.ethers.getSigners();
  const owner = account ? account.address : ADDRESS;

  console.log("TodoList:", ADDRESS);
  console.log("Reading tasks for:", owner);

  const count = await todo.taskCount(owner);
  console.log("Task count:", count.toString());

  const tasks = await todo.getTasks(owner);
  tasks.forEach((t) => {
    console.log(`  #${t.id} [${t.done ? "x" : " "}] ${t.text}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
