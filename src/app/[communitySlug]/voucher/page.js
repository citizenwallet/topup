"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
export default function Page({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cancelled = searchParams.get("cancelled");

  useEffect(() => {
    if (cancelled) return;
    const voucherUrl = window.localStorage.getItem("voucherUrl");
    router.push(voucherUrl);
  }, [router, cancelled]);

  if (cancelled) {
    return <p className="text-xl text-center p-8">Payment cancelled</p>;
  }

  return <p>Redirecting...</p>;
}
