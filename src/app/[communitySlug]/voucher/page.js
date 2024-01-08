"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
export default function Page({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cancelled = searchParams.get("cancelled");
  const error = searchParams.get("error");

  useEffect(() => {
    if (cancelled) return;
    const redirectUrl = window.localStorage.getItem("redirectUrl");
    router.replace(redirectUrl);
  }, [router, cancelled]);

  if (cancelled) {
    return <p className="text-xl text-center p-8">Payment cancelled</p>;
  }
  if (error) {
    return <p className="text-xl text-center p-8 text-red-800">{error}</p>;
  }

  return <p>Redirecting...</p>;
}
