import { task } from "hardhat/config";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Babel__factory } from "../../typechain";
import { TASK_DEPLOY } from "../task-names";

//npx hardhat deploy --network hardhat|localhost|rinkeby|mainnet
task(TASK_DEPLOY, "Deploy contract")
  .setAction(async (args, hre) => {
    let deployer: SignerWithAddress;

    const network = await hre.ethers.provider.getNetwork();
    console.log(`network: ${network.name}`);
    
    [deployer] = await hre.ethers.getSigners();
    const address = await deployer.getAddress();
    console.log(`deployer address: ${address}`);

    const BabelFactory = (await hre.ethers.getContractFactory(
      'Babel',
      deployer
    )) as Babel__factory;

    console.log('Deploying Babel...');
    const babel = await BabelFactory.deploy();
    await babel.deployed();

    console.log('Babel deployed to:', babel.address);
  });