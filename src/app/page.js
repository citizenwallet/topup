"use client";

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

const communities = [
  {
    name: "Zinne",
    formattedFxRate: "1 Zinne = 1 Euro",
    faucetAddress: "0x12187fD1414304fB91622eF2E80325c66Fa8AcE0",
  },
];
const fetcher = (...args) => fetch(...args).then((res) => res.json());

function useFaucet(account) {
  const apicall = `/api/balance?account=${account}`;
  const { data, error, isLoading } = useSWR(apicall, fetcher);
  return {
    faucet: data,
    isLoading,
    isError: error,
  };
}

export default function Home() {
  const account = communities[0].faucetAddress;
  const { faucet, isLoading, isError } = useFaucet(account);
  console.log(">>> faucet", faucet);
  return (
    <main className="flex flex-col p-4">
      <h1 className="text-2xl font-bold my-6 text-center">
        Top up your Citizen Wallet
      </h1>
      <h2 className="text-xl font-bold mb-4">Choose your community currency</h2>
      <div className="m-4">
        {communities.map((community, i) => (
          <Card className="w-full max-w-md mb-6" key={`package-${i}`}>
            <CardHeader>
              <CardTitle>{community.name}</CardTitle>
              <div className="text-sm text-gray-500">
                {community.formattedFxRate}
              </div>
            </CardHeader>
            <CardContent className="flex flex-col">
              <div className="flex flex-col my-2">
                <label className="mr-1">Faucet address:</label>
                <div className="text-xs text-gray-500">
                  {process.env.NEXT_PUBLIC_FAUCET_ADDRESS}
                </div>
              </div>
              <div className="flex items-end">
                <label className="mr-1">Balance:</label>
                <div className="text-xs">
                  {!isLoading && !isError && faucet && (
                    <div className="text-sm text-gray-500">
                      {faucet.balance} {faucet.tokenSymbol}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Link
                className="border border-gray-300 rounded-md p-3 dark:border-gray-600 block text-center py-2"
                href={`/zinne`}
              >
                Buy Now
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </main>
  );
}
