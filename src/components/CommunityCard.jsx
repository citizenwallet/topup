"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  CardTitle,
  CardHeader,
  CardContent,
  CardFooter,
  Card,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import useSWR from "swr";
const fetcher = (...args) => fetch(...args).then((res) => res.json());

function useFaucet(account, communitySlug) {
  const apicall = `/api/balance?account=${account}&communitySlug=${communitySlug}`;
  const { data, error, isLoading } = useSWR(apicall, fetcher);
  return {
    faucet: data,
    isLoading,
    isError: error,
  };
}

const networks = {
  137: {
    name: "Polygon",
    symbol: "MATIC",
  },
  42220: {
    name: "CELO",
    symbol: "CELO",
  },
};

export default function CommunityCard({ community }) {
  const { faucet, isLoading, isError } = useFaucet(
    process.env.NEXT_PUBLIC_FAUCET_ADDRESS,
    community.slug
  );
  console.log(">>> faucet", faucet);

  return (
    <Card className="w-full max-w-md mb-6">
      <CardHeader>
        <CardTitle>{community.name}</CardTitle>
        <div className="text-sm text-gray-500">{community.formattedFxRate}</div>
      </CardHeader>
      <CardContent className="flex flex-col">
        <div className="flex flex-col my-2">
          <label className="mr-1">Faucet address:</label>
          <div className="text-xs text-gray-500">
            {process.env.NEXT_PUBLIC_FAUCET_ADDRESS}
          </div>
        </div>
        <div className="flex flex-col">
          <label className="mr-1">Balance:</label>
          <div className="text-xs">
            {!isLoading && !isError && faucet && (
              <div className="text-sm text-gray-500">
                <div>
                  {faucet.nativeBalance} {networks[faucet.chainId].symbol}
                </div>
                <div>
                  {faucet.balance} {faucet.tokenSymbol}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Link
          className="border border-gray-300 rounded-md p-3 dark:border-gray-600 block text-center py-2"
          href={`/${community.slug}`}
        >
          Buy Now
        </Link>
      </CardFooter>
    </Card>
  );
}