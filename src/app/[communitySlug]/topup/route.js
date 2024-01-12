import { ethers, Wallet } from "ethers";
import { transfer } from "@/lib/transfer";
import { recordTransferEvent } from "@/lib/db";
import { redirect } from "next/navigation";
import { getConfig } from "@/lib/lib";
import {
  prepareUserOp,
  transferCallData,
  paymasterSignUserOp,
  signUserOp,
  submitUserOp,
} from "@/lib/4337";

import tokenEntryPointContractAbi from "smartcontracts/build/contracts/tokenEntryPoint/TokenEntryPoint.abi";

export async function GET(request, { params }) {
  console.log(">>> topup GET", request.nextUrl.searchParams.toString());
  const communitySlug = params.communitySlug;
  const searchParams = request.nextUrl.searchParams;
  const accountAddress = searchParams.get("accountAddress");

  function error(message) {
    redirect(
      `${process.env.NEXT_PUBLIC_WEBSITE_URL}/${communitySlug}?error=${message}`
    );
  }

  if (!communitySlug) {
    return error("communitySlug missing");
  }
  if (!accountAddress) {
    return error("accountAddress missing");
  }
  if (accountAddress.length != 42) {
    return error(
      "Invalid accountAddress length (must be 42 and start with 0x)"
    );
  }

  const amount = 100;

  const row = {
    processor: "topup",
    amount,
    accountAddress,
    chain: null,
  };

  console.log(">>> topup", row);

  try {
    // row.txHash = await transfer(communitySlug, row.amount, row.accountAddress);

    const config = await getConfig(communitySlug);
    if (!config) {
      throw new Error(`Community not found (${communitySlug})`);
    }

    const provider = new ethers.providers.JsonRpcProvider({
      url: config.node.url,
      skipFetchSetup: true,
    });

    const faucetWallet = new Wallet(process.env.FAUCET_PRIVATE_KEY);
    const signer = faucetWallet.connect(provider);

    const sender = process.env.FAUCET_ACCOUNT_ADDRESS;

    const callData = transferCallData(
      config.token.address,
      accountAddress,
      amount
    );

    let userop = await prepareUserOp(
      provider,
      signer.address,
      sender,
      callData,
      config
    );

    // get the paymaster to sign the userop
    userop = await paymasterSignUserOp(config.erc4337, userop);

    console.log(config.node.url);
    console.log(config.erc4337.entrypoint_address);

    const tokenEntryPointContract = new ethers.Contract(
      config.erc4337.entrypoint_address,
      tokenEntryPointContractAbi,
      provider
    );

    console.log(tokenEntryPointContract.functions);
    console.log(tokenEntryPointContract.address);

    // sign the userop
    const signature = await signUserOp(userop, tokenEntryPointContract, signer);

    userop.signature = signature;

    // submit the user op
    await submitUserOp(config.erc4337.rpc_url, userop, signer);

    console.log(">>> userop", userop);
  } catch (e) {
    console.log("!!! topup error", e);
    return error(e.message);
  }

  if (process.env.POSTGRES_URL) {
    recordTransferEvent(row);
  }

  // redirect(
  //   `${process.env.NEXT_PUBLIC_WEBSITE_URL}/${communitySlug}/voucher?success=true`
  // );
}
