import Bank from "@/components/Bank";
import { Button } from "@/components/ui/button";
import { generateUniqueId } from "@/lib/bank";
import { kv } from "@vercel/kv";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

export default async function Page({ params, searchParams }) {
  const communitySlug = params.communitySlug;
  const redirectUrl = decodeURIComponent(searchParams.redirectUrl).replace(
    /([^#])\/\?alias=/,
    `$1/#/?alias=`
  );

  const accountAddress = searchParams.account;

  const accountSlug = generateUniqueId(accountAddress, communitySlug);
  const savedAccount = await kv.get(`account_slug_${accountSlug}`);
  if (!savedAccount) {
    await kv.set(`account_slug_${accountSlug}`, accountSlug);
  }

  const iban = process.env.WISE_ACCOUNT;
  const accountName = process.env.WISE_ACCOUNT_NAME;

  return (
    <div className="p-4 flex flex-col gap-4 items-center">
      <h1 className="pt-6 text-2xl font-semibold my-6 text-center text-grey-500">
        Bank Transfer
      </h1>
      {communitySlug === "wallet.pay.brussels" && iban && accountName ? (
        <Bank accountSlug={accountSlug} iban={iban} accountName={accountName} />
      ) : null}
      <Link href={redirectUrl}>
        <Button
          variant="default"
          className="flex items-center justify-center gap-2 bg-grey-25 py-2 text-purple-primary"
        >
          Back to app <ExternalLink className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
