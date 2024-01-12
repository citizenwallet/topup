import { ethers } from "ethers";

import accountFactoryContractAbi from "smartcontracts/build/contracts/accfactory/AccountFactory.abi";
import tokenContractAbi from "smartcontracts/build/contracts/erc20/ERC20.abi";
import { getConfig } from "@/lib/lib";

export const dynamic = "force-dynamic";

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

  const config = await getConfig(communitySlug);
  const tokenContractAddress = config.token.address;

  if (!config) {
    return Response.json(
      {
        error: `Community not found (${communitySlug})`,
      },
      { status: 404 }
    );
  }

  console.log(">>> connecting to", config.node.url);
  console.log(">>> token contract address", tokenContractAddress);
  const provider = new ethers.providers.JsonRpcProvider({
    url: config.node.url,
    skipFetchSetup: true,
  });

  const gasPrice = await provider.getGasPrice();

  const signer = new ethers.Wallet(process.env.FAUCET_PRIVATE_KEY, provider);
  const address = signer.address;

  const accountFactoryContract = new ethers.Contract(
    config.erc4337.account_factory_address,
    accountFactoryContractAbi,
    provider
  );

  const account = await accountFactoryContract.getAddress(address, 0);

  const tokenContract = new ethers.Contract(
    tokenContractAddress,
    tokenContractAbi,
    provider
  );

  const nativeBalance = await provider.getBalance(address);
  const network = await provider.getNetwork();
  const balance = await tokenContract.balanceOf(account);
  const tokenSymbol = await tokenContract.symbol();
  const tokenDecimals = await tokenContract.decimals();
  console.log(">>> tokenContractAddress", tokenContractAddress);
  console.log(">>> tokenSymbol", tokenSymbol);
  console.log(">>> tokenDecimals", parseInt(tokenDecimals, 10));
  console.log("Account:", account);
  console.log("Balance:", balance.toString());
  console.log("Gas price:", ethers.utils.formatUnits(gasPrice, "gwei"));
  const decimals = parseInt(tokenDecimals, 10);
  const formattedBalance = parseFloat(
    ethers.utils.formatUnits(balance, tokenDecimals)
  ).toFixed(2);

  const data = {
    address,
    account,
    tokenContractAddress,
    tokenSymbol,
    tokenDecimals: decimals,
    balance: formattedBalance,
    nativeBalance: ethers.utils.formatEther(nativeBalance),
    chainId: network.chainId,
    config,
    gasPrice: ethers.utils.formatUnits(gasPrice, "gwei"),
  };

  return Response.json(data);
}
