import { Packages } from "@/components/packages";

export default function Page({ params }) {
  const packages = [
    {
      amount: 10,
      currency: "EUR",
      buyUrl: `/${params.communitySlug}/price_1OTnlaFAhaWeDyowRqMeZj6u`,
    },
    {
      amount: 20,
      currency: "EUR",
      buyUrl: `/${params.communitySlug}/price_1OTnmnFAhaWeDyowTm3oNEAS`,
    },
    {
      amount: 50,
      currency: "EUR",
      buyUrl: `/${params.communitySlug}/price_1OTnnPFAhaWeDyowzjuHlFNA`,
    },
  ];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold my-6 text-center">
        Choose Your Package
      </h1>

      <Packages packages={packages} />
    </div>
  );
}
