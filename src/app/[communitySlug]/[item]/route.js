import { redirect } from "next/navigation";

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

async function createStripeCheckoutSession(
  client_reference_id,
  item,
  { cancel_url, success_url }
) {
  const request = {
    cancel_url,
    line_items: [
      {
        price: item,
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url,
  };
  if (client_reference_id) {
    request.client_reference_id = client_reference_id;
  }
  const session = await stripe.checkout.sessions.create(request);

  return session;
}

function setUrl(url, key) {
  const searchParams = url.searchParams;
  searchParams.set(key, true);
  url.search = searchParams.toString();
  return url.toString();
}

export async function GET(request, { params }) {
  console.log(">>> urlParams", params);

  const searchParams = request.nextUrl.searchParams;
  const accountAddress = searchParams.get("accountAddress");
  console.log(">>> communitySlug", params.communitySlug);
  console.log(">>> accountAddress", accountAddress);
  console.log(">>> item", params.item);

  const session = await createStripeCheckoutSession(
    accountAddress,
    params.item,
    {
      cancel_url: setUrl(request.nextUrl, "cancelled"),
      success_url: setUrl(request.nextUrl, "success"),
    }
  );
  redirect(session.url);
}
