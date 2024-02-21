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
import { getTopupServerConfig } from "@/lib/lib";

export default async function Home() {
  const config = await getTopupServerConfig();

  return (
    <main className="flex flex-col p-4">
      <h1 className="text-2xl font-bold my-6 text-center">
        Top up your Citizen Wallet
      </h1>
      <h2 className="text-xl font-bold mb-4">Choose your community currency</h2>
      <div className="m-4">
        {config.communities
          .filter((c) => !c.hidden)
          .map((community, i) => (
            <CommunityCard community={community} key={`community-${i}`} />
          ))}
      </div>
    </main>
  );
}
