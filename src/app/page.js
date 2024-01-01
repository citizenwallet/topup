import Link from "next/link";
import { Button } from "../components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-col p-4">
      <h1 className="text-2xl font-bold my-6 text-center">
        Top up your Citizen Wallet
      </h1>
      <h2 className="text-xl font-bold mb-4">Choose your community currency</h2>
      <div className="m-4">
        <Link href="/zinne">
          <Button>Zinne</Button>
        </Link>
      </div>
    </main>
  );
}
