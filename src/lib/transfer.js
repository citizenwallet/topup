import { ethers, Wallet } from "ethers";

import tokenContractAbi from "@/smartcontracts/erc20.abi.json";
const tokenContractAddress = process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS;
// const tokenDecimals = 6;
const communitySlug = "zinne";
const communityUrl = "zinne.citizenwallet.xyz";

export async function transfer(amount, to) {
  // console.log(">>> sending", amount, "to", to);

  if (!amount) {
    throw new Error("Missing amount");
  }
  if (!to) {
    throw new Error("Missing to address");
  }

  // console.log(">>> connecting to", process.env.POLYGON_MUMBAI_RPC_URL);
  const provider = new ethers.providers.JsonRpcProvider({
    url: process.env.NEXT_PUBLIC_RPC_URL,
    skipFetchSetup: true,
  });

  const tokenContract = new ethers.Contract(
    tokenContractAddress,
    tokenContractAbi,
    provider
  );
  const tokenDecimals = await tokenContract.decimals();
  const tokenSymbol = await tokenContract.symbol();
  // console.log(">>> tokenSymbol", tokenSymbol, "decimals", tokenDecimals);

  const wallet = new Wallet(process.env.FAUCET_PRIVATE_KEY);
  const signer = wallet.connect(provider);
  const amountBigInt = BigInt((amount * 10 ** tokenDecimals) / 100); // Stripe uses cents, so we divide by 100

  const balance = await tokenContract.balanceOf(signer.address);

  console.log(">>> Sending", amount, tokenSymbol);
  console.log("From:", signer.address, `(balance: ${balance.toString()})`);
  console.log("To:", to);
  console.log("Amount:", amount);
  console.log("Amount BigInt:", amountBigInt);

  // Waiting for the transaction to be mined
  const transaction = tokenContract.populateTransaction.transfer(
    to,
    amountBigInt
  );
  const gasEstimate = await signer.estimateGas(transaction);
  transaction.gasLimit = (BigInt(gasEstimate) * 125n) / 100n;
  const tx = await tokenContract.connect(signer).transfer(to, amountBigInt, {
    gasLimit: (BigInt(gasEstimate) * 120n) / 100n,
  });

  // console.log("Mining transaction...");
  console.log(`\nhttps://mumbai.polygonscan.com/tx/${tx.hash}`);

  // // The transaction is now on chain!
  // console.log(`Mined in block ${tx.blockNumber}`);

  return tx.hash;
}
