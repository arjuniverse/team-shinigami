/**
 * Deployment script for DocumentHash contract
 * Run: npx hardhat run scripts/deploy-document-hash.js --network localhost
 */

const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying DocumentHash contract...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Deploy contract
  const DocumentHash = await hre.ethers.getContractFactory("DocumentHash");
  const documentHash = await DocumentHash.deploy();
  await documentHash.waitForDeployment();

  const address = await documentHash.getAddress();
  console.log("✅ DocumentHash deployed to:", address);
  console.log("\n📋 Add this to your client .env file:");
  console.log(`VITE_DOCUMENT_HASH_CONTRACT=${address}`);
  
  return address;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
