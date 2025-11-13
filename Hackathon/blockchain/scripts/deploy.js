const fs = require('fs');
const path = require('path');

async function main() {
  console.log("Deploying Anchor contract...");

  // Get the contract factory
  const Anchor = await ethers.getContractFactory("Anchor");
  
  // Deploy the contract
  const anchor = await Anchor.deploy();
  await anchor.waitForDeployment();
  
  const contractAddress = await anchor.getAddress();
  console.log("Anchor contract deployed to:", contractAddress);

  // Save contract address to JSON file
  const deploymentInfo = {
    contractAddress: contractAddress,
    deployedAt: new Date().toISOString(),
    network: "localhost"
  };

  const outputPath = path.join(__dirname, '..', 'deployed-address.json');
  fs.writeFileSync(
    outputPath,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("Contract address saved to deployed-address.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
