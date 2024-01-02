import { ethers } from "ethers";

import tokenContractAbi from "../../../smartcontracts/erc20.abi.json";

const tokenContractAddress = "0xBABCf159c4e3186cf48e4a48bC0AeC17CF9d90FE"; // mumbai
const tokenDecimals = 6;
const communitySlug = "zinne";
const communityUrl = "zinne.citizenwallet.xyz";

function error(message) {
  return new Response(JSON.stringify({ message }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const amount = searchParams.get("amount");
  const to = searchParams.get("to");

  console.log(">>> sending", amount, "to", to);

  if (!amount) {
    return error("Missing amount");
  }
  if (!to) {
    return error("Missing to address");
  }

  console.log(">>> connecting to", process.env.POLYGON_MUMBAI_RPC_URL);
  const provider = new ethers.providers.JsonRpcProvider({
    url: process.env.NEXT_PUBLIC_RPC_URL,
    skipFetchSetup: true,
  });

  const signer = new ethers.Wallet(process.env.FAUCET_PRIVATE_KEY, provider);
  const amountBigInt = ethers.utils.parseUnits(amount, tokenDecimals);

  const tokenContract = new ethers.Contract(
    tokenContractAddress,
    tokenContractAbi,
    provider
  );

  const balance = await tokenContract.balanceOf(signer.address);
  console.log(">>> faucet balance", balance.toString());
  const tokenSymbol = await tokenContract.symbol();
  console.log(">>> tokenSymbol", tokenSymbol);

  console.log(
    ">>> transfering tokens from",
    signer.address,
    "faucet EOA wallet to",
    to
  );

  // Waiting for the transaction to be mined
  const transaction = tokenContract.populateTransaction.transfer(
    to,
    amountBigInt
  );
  const gasEstimate = await signer.estimateGas(transaction);
  console.log(">>> gasEstimate", gasEstimate);
  const tx = await tokenContract.connect(signer).transfer(to, amountBigInt, {
    gasLimit: gasEstimate.mul(125).div(100),
  });

  console.log("Mining transaction...");
  console.log(`https://mumbai.polygonscan.com/tx/${tx.hash}`);

  // The transaction is now on chain!
  console.log(`Mined in block ${tx.blockNumber}`);

  const res = {
    from: signer.address,
    to,
    amount,
    token: tokenSymbol,
  };

  return new Response(JSON.stringify(res), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
