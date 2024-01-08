"use client";

import { Packages } from "@/components/packages";
import { createVoucher } from "@/lib/voucher";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function Page({ params }) {
  const [accountAddress, setAccountAddress] = useState();
  const communitySlug = params.communitySlug;

  const searchParams = useSearchParams();

  const account = searchParams.get("account");
  const redirectUrl = searchParams.get("redirectUrl");

  useEffect(() => {
    const getVoucher = async () => {
      window.voucherLoading = true;
      console.log(">>> creating voucher...");
      const voucher = await createVoucher(communitySlug);
      console.log(">>> voucher created", voucher);
      window.localStorage.setItem(
        "voucherAccountAddress",
        voucher.voucherAccountAddress
      );
      window.localStorage.setItem("redirectUrl", voucher.voucherUrl);
      setAccountAddress(voucher.voucherAccountAddress);
    };

    if (account) {
      setAccountAddress(account);
      window.localStorage.setItem("redirectUrl", redirectUrl);
      console.log(">>> account", account);
      console.log(">>> redirectUrl", redirectUrl);
    } else {
      // make sure we only create one voucher account
      if (!window.voucherLoading) getVoucher();
    }
  }, [account, redirectUrl, communitySlug]);

  const packages = {
    "gt.celo": [
      {
        amount: 10,
        name: "tokens of gratitude",
        buyUrl: `/${params.communitySlug}/topup`,
      },
    ],
    zinne: [
      {
        amount: 1,
        name: "Zinne",
        currency: "EUR",
        formattedFxRate: "1 Zinne = 1 Euro",
        buyUrl: `/${params.communitySlug}/price_1OTwVWFAhaWeDyowVKNOr5ls`,
      },
      {
        amount: 10,
        name: "Zinnes",
        currency: "EUR",
        formattedFxRate: "1 Zinne = 1 Euro",
        buyUrl: `/${params.communitySlug}/price_1OTwVWFAhaWeDyowMRJQkgZE`,
      },
      {
        amount: 20,
        name: "Zinnes",
        currency: "EUR",
        formattedFxRate: "1 Zinne = 1 Euro",
        buyUrl: `/${params.communitySlug}/price_1OTwVWFAhaWeDyow5IV6yjWI`,
      },
      {
        amount: 50,
        name: "Zinnes",
        currency: "EUR",
        formattedFxRate: "1 Zinne = 1 Euro",
        buyUrl: `/${params.communitySlug}/price_1OTwVWFAhaWeDyowCrxuuJnb`,
      },
    ],
  };

  // TEST ENV
  // const packages = [
  //   {
  //     amount: 1,
  //     currency: "EUR",
  //     buyUrl: `/${params.communitySlug}/price_1OTwUCFAhaWeDyowy0gQX1T5`,
  //   },
  //   {
  //     amount: 10,
  //     currency: "EUR",
  //     buyUrl: `/${params.communitySlug}/price_1OTnlaFAhaWeDyowRqMeZj6u`,
  //   },
  //   {
  //     amount: 20,
  //     currency: "EUR",
  //     buyUrl: `/${params.communitySlug}/price_1OTnmnFAhaWeDyowTm3oNEAS`,
  //   },
  //   {
  //     amount: 50,
  //     currency: "EUR",
  //     buyUrl: `/${params.communitySlug}/price_1OTnnPFAhaWeDyowzjuHlFNA`,
  //   },
  // ];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold my-6 text-center">
        Choose Your Package
      </h1>
      <Packages
        accountAddress={accountAddress}
        packages={packages[params.communitySlug]}
      />
    </div>
  );
}
