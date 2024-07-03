import { Packages } from "@/components/packages";
import CreateVoucher from "@/components/CreateVoucher";
import { getPlugin } from "@/lib/lib";
import Error from "@/components/Error";

export default async function Page({ params, searchParams }) {
  const communitySlug = params.communitySlug;

  const accountAddress = searchParams.account;
  const redirectUrl = decodeURIComponent(searchParams.redirectUrl).replace(
    /([^#])\/\?alias=/,
    `$1/#/?alias=`
  );
  let errorMessage = searchParams.error;

  const pluginConfig = getPlugin(communitySlug, "topup");

  if (!errorMessage && !pluginConfig) {
    errorMessage = `No configuration found for ${communitySlug}`;
  }

  return (
    <div className="p-4">
      <h1 className="pt-6 text-2xl font-semibold my-6 text-center text-grey-500">
        Top up
      </h1>
      {errorMessage && <Error message={errorMessage} />}
      {!errorMessage && (
        <>
          <Packages
            communitySlug={communitySlug}
            accountAddress={accountAddress}
            redirectUrl={redirectUrl}
            pluginConfig={pluginConfig}
          />
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
