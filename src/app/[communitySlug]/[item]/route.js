import { redirect } from "next/navigation";

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

async function createStripeCheckoutSession(
  client_reference_id,
  item,
  { cancel_url, success_url }
) {
  const request = {
    client_reference_id,
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

  const session = await createStripeCheckoutSession(
    accountAddress,
    params.item,
    {
      cancel_url: setUrl(redirectUrl, "cancelled"),
      success_url: setUrl(redirectUrl, "success"),
    }
  );
  redirect(session.url);
}
