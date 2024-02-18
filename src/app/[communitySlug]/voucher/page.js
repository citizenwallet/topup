"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
export default function Page({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cancelled = searchParams.get("cancelled");
  const error = searchParams.get("error");

  useEffect(() => {
    if (cancelled) return;
    const redirectUrl = window.localStorage.getItem("redirectUrl");
    window.localStorage.removeItem("redirectUrl");

    router.replace(redirectUrl); // `${redirectUrl}&response=${JSON.stringify(params)}`
  }, [router, cancelled]);

  if (cancelled) {
    return (
      <div>
        <p className="text-xl text-center p-8">Payment cancelled</p>
        <Button
          onClick={() => router.replace(`/${params.communitySlug}`)}
          className="block mx-auto"
        >
          Go back
        </Button>
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <p className="text-xl text-center p-8 text-red-800">{error}</p>
        <Button
          onClick={() => router.replace(`/${params.communitySlug}`)}
          className="block mx-auto"
        >
          Go back
        </Button>
      </div>
    );
  }

  return <p>Redirecting...</p>;
}
