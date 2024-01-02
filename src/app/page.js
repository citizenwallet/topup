import Link from "next/link";
import {
  CardTitle,
  CardHeader,
  CardContent,
  CardFooter,
  Card,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CommunityCard from "@/components/CommunityCard";
import { getConfig } from "@/lib/lib";

const communities = [
  {
    name: "Zinne",
    slug: "zinne",
    formattedFxRate: "1 Zinne = 1 Euro",
    faucetAddress: "0x12187fD1414304fB91622eF2E80325c66Fa8AcE0",
    config: getConfig("zinne"),
  },
  {
    name: "Gratitude",
    slug: "gt.celo",
    faucetAddress: "0x12187fD1414304fB91622eF2E80325c66Fa8AcE0",
    formattedFxRate: "Get 10 tokens of gratitude for free",
    config: getConfig("gt.celo"),
  },
];

export default async function Home() {
  return (
    <main className="flex flex-col p-4">
      <h1 className="text-2xl font-bold my-6 text-center">
        Top up your Citizen Wallet
      </h1>
      <h2 className="text-xl font-bold mb-4">Choose your community currency</h2>
      <div className="m-4">
        {communities.map((community, i) => (
          <CommunityCard community={community} key={`community-${i}`} />
        ))}
      </div>
    </main>
  );
}
