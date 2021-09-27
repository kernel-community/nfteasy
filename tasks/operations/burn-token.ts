import { task, types } from "hardhat/config";
import { ContractTransaction } from "ethers";
import { Babel } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { TASK_BURN } from "../task-names";

// npx hardhat burn-token --network rinkeby|mainnet|localhost --token-id 22
task(TASK_BURN, "Burns a token by token id")
  .addParam("tokenId", "The token id", null, types.int)
  .setAction(async ({ tokenId }, hre) => {
    const abi = [
      'function burn(uint256 tokenId) public',
    ]

    let deployer: SignerWithAddress;

    console.log('burning:', tokenId);

    [deployer] = await hre.ethers.getSigners();
    const address = await deployer.getAddress();
    console.log(`deployer address: ${address}`);

    const network = await hre.ethers.provider.getNetwork();
    console.log(`network: ${network.name}`);

    var contractAddress = "";
    if (network.name === "rinkeby") {
      contractAddress = process.env.RINKEBY_CONTRACT_ADDRESS || '';
    } else if (network.name === "homestead") {
      contractAddress = process.env.MAINNET_CONTRACT_ADDRESS || '';
    } else if (network.name === "unknown") { //localhost network
      contractAddress = process.env.LOCALHOST_CONTRACT_ADDRESS || '';
    }
    console.log(`contractAddress: ${contractAddress}`);

    const contract: Babel = new hre.ethers.Contract(contractAddress, abi, deployer) as Babel;

    const receipt: ContractTransaction = await contract.connect(deployer)
      .burn(tokenId, { gasLimit: 300000 });

    console.log('burned:', receipt);
    process.exit(0)
  });