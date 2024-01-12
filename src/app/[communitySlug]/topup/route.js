import { ethers, Wallet } from "ethers";
import { recordTransferEvent } from "@/lib/db";
import { redirect } from "next/navigation";
import { getConfig } from "@/lib/lib";
import { userOpERC20Transfer } from "@/lib/4337";

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

  const amount = 1;

  const row = {
    processor: "topup",
    amount,
    accountAddress,
    chain: null,
  };

  try {
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

    await userOpERC20Transfer(config, provider, signer, accountAddress, amount);
  } catch (e) {
    return error(e.message);
  }

  if (process.env.POSTGRES_URL) {
    recordTransferEvent(row);
  }

  redirect(
    `${process.env.NEXT_PUBLIC_WEBSITE_URL}/${communitySlug}/voucher?success=true`
  );
}
