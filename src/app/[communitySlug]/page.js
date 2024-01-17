import { Packages } from "@/components/packages";
import CreateVoucher from "@/components/CreateVoucher";
import { getPlugin } from "@/lib/lib";

export default async function Page({ params, searchParams }) {
  const communitySlug = params.communitySlug;

  const accountAddress = searchParams.account;
  const redirectUrl = searchParams.redirectUrl;

  const pluginConfig = getPlugin(communitySlug, "topup");

  if (!pluginConfig) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold my-6">Error</h1>
        <p>No configuration found for {communitySlug}</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold my-6 text-center">
        Choose Your Package
      </h1>
      <Packages
        communitySlug={communitySlug}
        accountAddress={accountAddress}
        packages={pluginConfig.packages}
      />
      <CreateVoucher
        communitySlug={communitySlug}
        accountAddress={accountAddress}
        redirectUrl={redirectUrl}
      />
    </div>
  );
}
