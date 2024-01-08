import { getAccountForWalletAddress } from "@/lib/account";

export async function GET(req) {
  const searchParams = req.nextUrl.searchParams;
  const walletAddress = searchParams.get("walletAddress");
  const communitySlug = searchParams.get("communitySlug");
  if (!communitySlug) {
    return Response.json({
      error: "Missing communitySlug",
    });
  }
  if (!walletAddress || walletAddress.length !== 42) {
    return Response.json({
      walletAddress,
      accountAddress: null,
      error: "Invalid wallet address length",
    });
  }

  const accountAddress = await getAccountForWalletAddress(
    walletAddress,
    communitySlug
  );

  return Response.json({
    walletAddress,
    communitySlug,
    accountAddress,
  });
}
