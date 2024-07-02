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
import useFaucet from "@/hooks/use-faucet";
import networks from "@/networks.json";

export default function CommunityCard({ community }) {
  const { faucet, isLoading, isError } = useFaucet(community.slug);
  if (isError || (faucet && faucet.error)) {
    return (
      <Card className="w-full max-w-md mb-6">
        <CardHeader>
          <CardTitle>{community.name}</CardTitle>
          <div className="text-sm text-gray-500">{community.description}</div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-500">
            Error fetching faucet data {faucet.error}
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
  return (
    <Card className="w-full max-w-md mb-6">
      <CardHeader>
        <CardTitle>{community.name}</CardTitle>
        <div className="text-sm text-gray-500">{community.description}</div>
      </CardHeader>
      {faucet && (
        <CardContent className="flex flex-col">
          <div className="flex flex-col my-2">
            <label className="mr-1">Sponsor wallet address:</label>
            <div className="text-xs text-gray-500">
              <a
                href={`${networks[community.chainId].explorer}/address/${
                  faucet.sponsorAddress
                }`}
              >
                {faucet.sponsorAddress}
              </a>
            </div>
          </div>
          <div className="flex flex-col">
            <label className="mr-1">Balance:</label>
            <div className="text-xs">
              {!isLoading && !isError && faucet && (
                <div className="text-sm text-gray-500">
                  <div>
                    <a
                      href={`${networks[community.chainId].explorer}/address/${
                        faucet.sponsorAddress
                      }`}
                    >
                      {faucet.nativeBalance}
                      {` `}

                      {faucet.chainId && networks[faucet.chainId].symbol}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col my-2">
            <label className="mr-1">Faucet account address:</label>
            <div className="text-xs text-gray-500">
              <a
                href={`${networks[community.chainId].explorer}/address/${
                  faucet.account
                }`}
              >
                {faucet.account}
              </a>
            </div>
          </div>
          <div className="flex flex-col">
            <label className="mr-1">Balance:</label>
            <div className="text-xs">
              {!isLoading && !isError && faucet && (
                <div className="text-sm text-gray-500">
                  <div>
                    {faucet.balance}{" "}
                    <a
                      href={`${networks[community.chainId].explorer}/address/${
                        faucet.tokenContractAddress
                      }`}
                    >
                      {faucet.tokenSymbol}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      )}
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
