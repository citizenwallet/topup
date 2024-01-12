"use client";

import { createVoucher } from "@/lib/voucher";
import { useEffect, useState } from "react";

export default function CreateVoucherComponent({
  communitySlug,
  account,
  redirectUrl,
}) {
  console.log(
    ">>> CreateVoucherComponent",
    communitySlug,
    account,
    redirectUrl
  );
  const [accountAddress, setAccountAddress] = useState();
  useEffect(() => {
    const getVoucher = async () => {
      window.voucherLoading = true;
      console.log(">>> creating voucher for", communitySlug);
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

  return <div>Hello</div>;
}
