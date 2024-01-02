import { getAccountForWalletAddress } from "@/lib/account";

export async function GET(req) {
  const searchParams = req.nextUrl.searchParams;
  const walletAddress = searchParams.get("walletAddress");
  if (!walletAddress || walletAddress.length !== 42) {
    return Response.json({
      walletAddress,
      accountAddress: null,
      error: "Invalid wallet address length",
    });
  }

  const voucherAccountAddress = await getAccountForWalletAddress(walletAddress);

  return Response.json({
    walletAddress,
    accountAddress: voucherAccountAddress,
  });
}
