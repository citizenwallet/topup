import { ethers } from "ethers";

import accountFactoryContractAbi from "smartcontracts/build/contracts/accfactory/AccountFactory.abi";
import tokenContractAbi from "smartcontracts/build/contracts/erc20/ERC20.abi";
import { getConfig } from "@/lib/lib";

if (!process.env.FAUCET_PRIVATE_KEY) {
  console.error("!!! FAUCET_PRIVATE_KEY not set");
  process.exit(0);
}

export const dynamic = "force-dynamic";

async function getSponsorAddress(paymasterContractAddress, provider) {
  const abi = ["function sponsor() public view returns (address)"];

  const contract = new ethers.Contract(paymasterContractAddress, abi, provider);

  const sponsorAddress = await contract.sponsor();

  return sponsorAddress;
}

export async function GET(req, res) {
  const { searchParams } = new URL(req.url);
  const communitySlug = searchParams.get("communitySlug");

  if (!communitySlug) {
    return Response.json(
      {
        error: "Missing communitySlug",
      },
      { status: 400 }
    );
  }

  console.log(">>> communitySlug", communitySlug);
  const config = await getConfig(communitySlug);
  console.log(">>> config", config && config.community);

  if (!config) {
    return Response.json(
      {
        error: `Community not found (${communitySlug})`,
      },
      { status: 404 }
    );
  }

  if (!config.node.url) {
    return Response.json(
      {
        error: `Node URL not found for community (${communitySlug})`,
      },
      { status: 404 }
    );
  }
  const tokenContractAddress = config.token.address;
  console.log(">>> connecting to", config.node.url);
  console.log(">>> token contract address", tokenContractAddress);
  const provider = new ethers.JsonRpcProvider(config.node.url);

  const sponsorAddress = await getSponsorAddress(
    config.erc4337.paymaster_address,
    provider
  );

  const signer = new ethers.Wallet(process.env.FAUCET_PRIVATE_KEY, provider);
  const address = signer.address;

  const accountFactoryContract = new ethers.Contract(
    config.erc4337.account_factory_address,
    accountFactoryContractAbi,
    provider
  );

  const account = await accountFactoryContract.getFunction("getAddress")(
    address,
    0
  );

  const tokenContract = new ethers.Contract(
    tokenContractAddress,
    tokenContractAbi,
    provider
  );

  const nativeBalance = await provider.getBalance(sponsorAddress);
  const network = await provider.getNetwork();
  const balance = await tokenContract.balanceOf(account);
  const tokenSymbol = await tokenContract.symbol();
  const tokenDecimals = await tokenContract.decimals();
  // console.log(">>> tokenContractAddress", tokenContractAddress);
  // console.log(">>> tokenSymbol", tokenSymbol);
  // console.log(">>> tokenDecimals", parseInt(tokenDecimals, 10));
  // console.log("Account:", account);
  // console.log("Balance:", balance.toString());
  // console.log("Gas price:", ethers.formatUnits(gasPrice, "gwei"));
  const decimals = parseInt(tokenDecimals, 10);
  const formattedBalance = parseFloat(
    ethers.formatUnits(balance, tokenDecimals)
  ).toFixed(2);

  const data = {
    address,
    account,
    tokenContractAddress,
    tokenSymbol,
    tokenDecimals: Number(decimals),
    balance: formattedBalance,
    sponsorAddress,
    nativeBalance: ethers.formatEther(nativeBalance),
    chainId: Number(network.chainId),
    config,
  };

  console.log(">>> data", data);
  return Response.json(data);
}
