import { Packages } from "@/components/packages";
import Amounts from "@/components/Amounts";
import CreateVoucher from "@/components/CreateVoucher";
import { getPlugin } from "@/lib/lib";
import Error from "@/components/Error";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LandmarkIcon } from "lucide-react";

export default async function Page({ params, searchParams }) {
  const communitySlug = params.communitySlug;

  const accountAddress = searchParams.account;
  const title = searchParams.title || "Top up";
  const amounts = searchParams.amounts;
  const redirectUrl = decodeURIComponent(searchParams.redirectUrl).replace(
    /([^#])\/\?alias=/,
    `$1/#/?alias=`
  );

  let errorMessage = searchParams.error;

  const pluginConfig = getPlugin(communitySlug, "topup");

  if (!errorMessage && !pluginConfig) {
    errorMessage = `No topup server configuration found for ${communitySlug}`;
  }

  const iban = process.env.WISE_ACCOUNT;
  const accountName = process.env.WISE_ACCOUNT_NAME;

  return (
    <div className="p-4">
      <h1 className="pt-6 text-2xl font-semibold my-6 text-center text-grey-500">
        {title}
      </h1>
      {errorMessage && <Error message={errorMessage} />}
      {!errorMessage && (
        <>
          <h2 className="text-xl font-semibold text-center text-grey-500">
            Fast
          </h2>
          {!amounts && (
            <Packages
              communitySlug={communitySlug}
              accountAddress={accountAddress}
              redirectUrl={redirectUrl}
              pluginConfig={pluginConfig}
            />
          )}
          {amounts && (
            <Amounts
              amounts={amounts}
              title={title}
              communitySlug={communitySlug}
              accountAddress={accountAddress}
              redirectUrl={redirectUrl}
            />
          )}
          {communitySlug === "wallet.pay.brussels" && iban && accountName && (
            <>
              <h2 className="text-xl font-semibold my-4 text-center text-grey-500">
                Not as fast
              </h2>
              <div className="flex justify-center">
                <Link
                  href={`${communitySlug}/bank${
                    searchParams
                      ? `?${new URLSearchParams(searchParams).toString()}`
                      : ""
                  }`}
                >
                  <Button
                    variant="default"
                    className="flex items-center justify-center gap-2 bg-grey-25 py-6 text-purple-primary font-medium text-2xl"
                  >
                    Via Bank Transfer <LandmarkIcon className="h-8 w-8" />
                  </Button>
                </Link>
              </div>
            </>
          )}
          <CreateVoucher
            communitySlug={communitySlug}
            accountAddress={accountAddress}
            redirectUrl={redirectUrl}
          />
        </>
      )}
    </div>
  );
}
