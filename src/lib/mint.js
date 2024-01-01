import { ethers, Wallet, JsonRpcProvider } from "ethers";
import fs from "fs";
import { parseUnits } from "@ethersproject/units";

const tokenContractAbi = JSON.parse(
  fs.readFileSync("./src/smartcontracts/erc20.abi.json", "utf-8")
);
const tokenContractAddress = "0xBABCf159c4e3186cf48e4a48bC0AeC17CF9d90FE"; // mumbai
// const tokenDecimals = 6;
const communitySlug = "zinne";
const communityUrl = "zinne.citizenwallet.xyz";

export async function mint(amount, to) {
  // console.log(">>> sending", amount, "to", to);

  if (!amount) {
    throw new Error("Missing amount");
  }
  if (!to) {
    throw new Error("Missing to address");
  }

  // console.log(">>> connecting to", process.env.POLYGON_MUMBAI_RPC_URL);
  const provider = new JsonRpcProvider(process.env.POLYGON_MUMBAI_RPC_URL);

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
  const amountBigInt = BigInt(amount);

  const balance = await tokenContract.balanceOf(signer.address);

  console.log(">>> Sending", amount, tokenSymbol);
  console.log("From:", signer.address, `(balance: ${balance.toString()})`);
  console.log("To:", to);

  // Waiting for the transaction to be mined
  const transaction = tokenContract.transfer.populateTransaction(
    to,
    amountBigInt
  );
  const gasEstimate = await signer.estimateGas(transaction);
  transaction.gasLimit = BigInt((gasEstimate * 125n) / 100n);
  const tx = await tokenContract.connect(signer).transfer(to, amountBigInt, {
    gasLimit: BigInt((gasEstimate * 120n) / 100n),
  });

  // console.log("Mining transaction...");
  console.log(`\nhttps://mumbai.polygonscan.com/tx/${tx.hash}`);

  // // The transaction is now on chain!
  // console.log(`Mined in block ${tx.blockNumber}`);

  return tx.hash;
}
