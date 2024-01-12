import { ethers, Wallet } from "ethers";
import { getConfig } from "@/lib/lib";
import tokenContractAbi from "@/smartcontracts/erc20.abi.json";

export async function transfer(communitySlug, amount, to) {
  console.log(">>> sending", communitySlug, amount / 100, "to", to);

  if (!communitySlug) {
    throw new Error("Missing communitySlug");
  }
  if (!amount) {
    throw new Error("Missing amount");
  }
  if (!to) {
    throw new Error("Missing to address");
  }

  const config = await getConfig(communitySlug);
  if (!config) {
    throw new Error(`Community not found (${communitySlug})`);
  }

  const tokenContractAddress = config.token.address;
  // console.log(">>> connecting to", config.node.url);
  const provider = new ethers.providers.JsonRpcProvider({
    url: config.node.url,
    skipFetchSetup: true,
  });

  const currentGasPrice = await provider.getGasPrice();
  console.log(
    `Current gas price: ${ethers.utils.formatUnits(
      currentGasPrice,
      "gwei"
    )} gwei`
  );

  const tokenContract = new ethers.Contract(
    tokenContractAddress,
    tokenContractAbi,
    provider
  );
  const tokenDecimals = await tokenContract.decimals();
  const tokenSymbol = await tokenContract.symbol();
  console.log(">>> tokenSymbol", tokenSymbol, "decimals", tokenDecimals);

  const faucetWallet = new Wallet(process.env.FAUCET_PRIVATE_KEY);
  const signer = faucetWallet.connect(provider);
  const amountBigInt = BigInt((amount * 10 ** tokenDecimals) / 100); // Stripe uses cents, so we divide by 100

  const balance = await tokenContract.balanceOf(signer.address);

  console.log("From:", signer.address, `(balance: ${balance.toString()})`);
  console.log("To:", to);
  console.log("Amount:", amount);
  console.log("Amount BigInt:", amountBigInt);

  const transaction = tokenContract.populateTransaction.transfer(
    to,
    amountBigInt
  );
  const gasEstimate = await signer.estimateGas(transaction);
  const gasLimit = (BigInt(gasEstimate) * 250n) / 100n;
  const gasPrice = BigInt(currentGasPrice) * 2n;
  transaction.gasLimit = (BigInt(gasEstimate) * 125n) / 100n;
  // Waiting for the transaction to be mined
  try {
    const tx = await tokenContract.connect(signer).transfer(to, amountBigInt, {
      gasLimit,
      gasPrice,
    });

    console.log(
      "Mining transaction with gas estimate:",
      gasEstimate.toString(),
      "and gas price",
      gasPrice.toString()
    );
    console.log(`\n${config.scan.url}/tx/${tx.hash}`);
    // console.log(`\nhttps://mumbai.polygonscan.com/tx/${tx.hash}`);

    // // The transaction is now on chain!
    console.log(">>> waiting for transaction to be mined...", tx.blockNumber);
    await tx.wait();
    console.log(`Mined in block ${tx.blockNumber}`);
    return tx.hash;
  } catch (e) {
    console.error(
      "!!! error sending transaction",
      JSON.stringify(e, null, "  ")
    );
    if (e.code === "INSUFFICIENT_FUNDS") {
      const walletBalance = await provider.getBalance(faucetWallet.address);
      throw new Error(
        `Insufficient funds on the faucet account (${
          faucetWallet.address
        } balance: ${ethers.utils.formatEther(
          walletBalance,
          "gwei"
        )}) to pay for the transaction fee on chain ${e.transaction.chainId}`
      );
    }
    throw new Error("Unable to transfer the tokens: " + e.reason);
  }
}
