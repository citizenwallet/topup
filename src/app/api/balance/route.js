import { ethers } from "ethers";

import tokenContractAbi from "@/smartcontracts/erc20.abi.json";
const tokenContractAddress = process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS;

export async function GET(req, res) {
  const { searchParams } = new URL(req.url);
  let account = searchParams.get("account");

  // console.log(">>> connecting to", process.env.POLYGON_MUMBAI_RPC_URL);
  // console.log(">>> token contract address", tokenContractAddress);
  const provider = new ethers.providers.JsonRpcProvider({
    url: process.env.NEXT_PUBLIC_RPC_URL,
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

  const balance = await tokenContract.balanceOf(account);
  const tokenSymbol = await tokenContract.symbol();
  const tokenDecimals = await tokenContract.decimals();
  console.log(">>> tokenAddress", account);
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
    tokenAddress: process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS,
    tokenSymbol,
    tokenDecimals: decimals,
    balance: formattedBalance,
    gasPrice: ethers.utils.formatUnits(gasPrice, "gwei"),
  };

  return Response.json(data);
}
