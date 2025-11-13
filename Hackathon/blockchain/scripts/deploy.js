/**
 * Deployment script for DocumentHash contract
 * Deploys to localhost and saves deployment info
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying DocumentHash contract...");
  console.log("📡 Network:", hre.network.name);

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

  // Get contract artifact for ABI
  const artifact = await hre.artifacts.readArtifact("DocumentHash");

  // Prepare deployment info
  const deploymentInfo = {
    address: address,
    abi: artifact.abi,
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
  };

  // Create deployments directory
  const deploymentsDir = path.join(__dirname, "..", "deployments", hre.network.name);
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info
  const deploymentPath = path.join(deploymentsDir, "DocumentHash.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("📄 Deployment info saved to:", deploymentPath);
  console.log("\n📋 Add this to your client .env file:");
  console.log(`VITE_DOCUMENT_HASH_CONTRACT=${address}`);
  console.log(`VITE_CHAIN_ID=${hre.network.config.chainId}`);
  
  return address;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
