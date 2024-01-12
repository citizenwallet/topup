import { getPlugin } from "@/lib/lib";
import { transfer } from "@/lib/transfer";
import { recordTransferEvent } from "@/lib/db";
import { redirect } from "next/navigation";

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
  const communitySlug = params.communitySlug;
  const amount = parseInt(params.amount, 10);

  function error(message) {
    redirect(
      `${process.env.NEXT_PUBLIC_WEBSITE_URL}/${communitySlug}?error=${message}`
    );
  }

  const redirectUrl = `${process.env.NEXT_PUBLIC_WEBSITE_URL}/${params.communitySlug}/voucher`;
  const pluginConfig = getPlugin(params.communitySlug, "topup");

  if (!pluginConfig.stripe) {
    const row = {
      processor: "topup",
      amount: amount * 100, // we use cents
      accountAddress,
      chain: null,
    };

    console.log(">>> topup", row);

    try {
      row.txHash = await transfer(
        communitySlug,
        row.amount,
        row.accountAddress
      );
    } catch (e) {
      console.log("!!! topup error", e);
      return error(e.message);
    }

    if (process.env.POSTGRES_URL) {
      recordTransferEvent(row);
    }

    redirect(
      `${process.env.NEXT_PUBLIC_WEBSITE_URL}/${communitySlug}/voucher?success=true`
    );
  }
  const prices = pluginConfig.stripe.prices;
  const line_items = [
    {
      price: prices.unit,
      quantity: amount,
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
