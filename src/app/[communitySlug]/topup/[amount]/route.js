import { redirect } from "next/navigation";
import { getPlugin } from "@/lib/lib";

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

async function createStripeCheckoutSession(
  client_reference_id,
  line_items,
  { cancel_url, success_url }
) {
  const request = {
    client_reference_id,
    cancel_url,
    line_items,
    mode: "payment",
    success_url,
  };
  console.log(">>> stripe session request", request);
  const session = await stripe.checkout.sessions.create(request);

  return session;
}

function setUrl(urlString, key) {
  const urlObject = new URL(urlString);
  urlObject.searchParams.set(key, true);
  urlObject.search = urlObject.searchParams.toString();
  return urlObject.toString();
}

export async function GET(request, { params }) {
  const searchParams = request.nextUrl.searchParams;
  const accountAddress = searchParams.get("accountAddress");
  // console.log(">>> communitySlug", params.communitySlug);
  // console.log(">>> accountAddress", accountAddress);
  // console.log(">>> item", params.item);

  const redirectUrl = `${process.env.NEXT_PUBLIC_WEBSITE_URL}/${params.communitySlug}/voucher`;
  const pluginConfig = await getPlugin(params.communitySlug, "topup");
  const prices = pluginConfig.stripe.prices;
  const line_items = [
    {
      price: prices.unit,
      quantity: parseInt(params.amount, 10),
    },
    {
      price: prices.fees,
      quantity: 1,
    },
  ];

  const session = await createStripeCheckoutSession(
    accountAddress,
    line_items,
    {
      cancel_url: setUrl(redirectUrl, "cancelled"),
      success_url: setUrl(redirectUrl, "success"),
    }
  );
  redirect(session.url);
}
