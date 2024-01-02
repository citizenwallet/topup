"use client";

import { Packages } from "@/components/packages";
import { createVoucher } from "@/lib/voucher";
import { useEffect, useState } from "react";

export default function Page({ params }) {
  const [accountAddress, setAccountAddress] = useState();

  const communityUrl = "zinne.citizenwallet.xyz";
  const communitySlug = "zinne";

  useEffect(() => {
    const getVoucher = async () => {
      window.voucherLoading = true;
      console.log(">>> creating voucher...");
      const voucher = await createVoucher({
        slug: communitySlug,
        url: communityUrl,
      });
      console.log(">>> voucher created", voucher);
      window.localStorage.setItem(
        "voucherAccountAddress",
        voucher.voucherAccountAddress
      );
      window.localStorage.setItem("voucherUrl", voucher.voucherUrl);
      setAccountAddress(voucher.voucherAccountAddress);
    };
    // make sure we only create one voucher account
    if (!window.voucherLoading) getVoucher();
  }, []);

  const packages = [
    {
      amount: 10,
      currency: "EUR",
      buyUrl: `/${params.communitySlug}/price_1OTnlaFAhaWeDyowRqMeZj6u`,
    },
    {
      amount: 20,
      currency: "EUR",
      buyUrl: `/${params.communitySlug}/price_1OTnmnFAhaWeDyowTm3oNEAS`,
    },
    {
      amount: 50,
      currency: "EUR",
      buyUrl: `/${params.communitySlug}/price_1OTnnPFAhaWeDyowzjuHlFNA`,
    },
  ];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold my-6 text-center">
        Choose Your Package
      </h1>
      <Packages accountAddress={accountAddress} packages={packages} />
    </div>
  );
}
