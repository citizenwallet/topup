import { ethers } from "ethers";

import tokenContractAbi from "@/smartcontracts/erc20.abi.json";
import { getConfig } from "@/lib/lib";

export const dynamic = "force-dynamic";

export async function GET(req, res) {
  const { searchParams } = new URL(req.url);
  let account = searchParams.get("account");
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

  if (!account) {
    const signer = new ethers.Wallet(process.env.FAUCET_PRIVATE_KEY, provider);
    account = signer.address;
  }

  const tokenContract = new ethers.Contract(
    tokenContractAddress,
    tokenContractAbi,
    provider
  );

  const nativeBalance = await provider.getBalance(account);
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
