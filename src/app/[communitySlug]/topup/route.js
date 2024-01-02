import { transfer } from "@/lib/transfer";
import { recordTransferEvent } from "@/lib/db";
import { redirect } from "next/navigation";

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

  const row = {
    processor: "topup",
    amount: 100,
    accountAddress,
    chain: null,
  };

  console.log(">>> topup", row);

  try {
    row.txHash = await transfer(communitySlug, row.amount, row.accountAddress);
  } catch (e) {
    console.log("!!! topup error", e);
    return error(e.message);
  }

  if (process.env.POSTGRES_URL) {
    recordTransferEvent(row);
  }

  redirect(
    `${process.env.NEXT_PUBLIC_WEBSITE_URL}/${communitySlug}/voucher?success=true`
  );
}
