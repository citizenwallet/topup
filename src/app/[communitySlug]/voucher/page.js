"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
export default function Page({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (searchParams.get("cancelled")) {
    return <p>Payment cancelled</p>;
  }

  useEffect(() => {
    const voucherUrl = window.localStorage.getItem("voucherUrl");
    router.push(voucherUrl);
  }, [router]);
  return <p>Redirecting...</p>;
}
