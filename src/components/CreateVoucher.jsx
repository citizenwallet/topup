"use client";

import { createVoucher } from "@/lib/voucher";

function store(accountAddress, redirectUrl) {
  window.localStorage.setItem("accountAddress", accountAddress);
  window.localStorage.setItem("redirectUrl", redirectUrl);
}

export default function CreateVoucherComponent({
  communitySlug,
  accountAddress,
  redirectUrl,
}) {
  if (typeof window === "undefined") return <></>;

  const createNewVoucher = async () => {
    window.voucherLoading = true;
    console.log(">>> creating voucher for", communitySlug);
    const voucher = await createVoucher(communitySlug);
    console.log(">>> voucher created", voucher);
    store(voucher.voucherAccountAddress, voucher.voucherUrl);
    window.voucherLoading = false;
  };

  if (accountAddress && redirectUrl) {
    store(accountAddress, redirectUrl);
    console.log(">>> accountAddress", accountAddress);
    console.log(">>> redirectUrl", redirectUrl);
  } else {
    // make sure we only create one voucher account
    if (!window.voucherLoading) createNewVoucher();
  }

  return <></>;
}
