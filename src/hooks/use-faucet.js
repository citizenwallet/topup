"use client";

import useSWR from "swr";
const fetcher = (...args) => fetch(...args).then((res) => res.json());

export default function useFaucet(communitySlug) {
  const apicall = `/api/balance?communitySlug=${communitySlug}`;
  const { data, error, isLoading } = useSWR(apicall, fetcher);
  return {
    faucet: data,
    isLoading,
    isError: error,
  };
}
