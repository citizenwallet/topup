import stripe from "stripe";
import { recordTransferEvent } from "@/lib/db";
import { getConfig } from "@/lib/lib";
import { Wallet, ethers } from "ethers";
import { userOpERC20Transfer } from "@/lib/4337";

function getCommunitySlugFromUrl(url) {
  const urlObject = new URL(url);
  const path = urlObject.pathname;
  const pathParts = path.split("/");
  return pathParts[1];
}

export async function POST(request) {
  const sig = request.headers.get("stripe-signature");
  const body = await request.text();

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log("!!! ERROR", err.message, JSON.stringify(err, null, 2));
    return Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      console.log(">>> event data", event.type, event.data.object);

      const communitySlug = getCommunitySlugFromUrl(
        event.data.object.success_url
      );
      const row = {
        communitySlug,
        processor: "stripe",
        processor_id: event.data.object.id,
        amount: event.data.object.amount_total - 100, // We remove the €1 fees
        currency: event.data.object.currency,
        accountAddress: event.data.object.client_reference_id,
        chain: null,
        data: event.data.object,
      };

      const config = await getConfig(communitySlug);
      if (!config) {
        throw new Error(`Community not found (${communitySlug})`);
      }

      const provider = new ethers.providers.JsonRpcProvider({
        url: config.node.url,
        skipFetchSetup: true,
      });

      const faucetWallet = new Wallet(process.env.FAUCET_PRIVATE_KEY);
      const signer = faucetWallet.connect(provider);

      const signature = await userOpERC20Transfer(
        config,
        provider,
        signer,
        row.accountAddress,
        row.amount / 100
      );

      row.txHash = signature;

      if (process.env.POSTGRES_URL) {
        recordTransferEvent(row);
      }

      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  return new Response("ok", { status: 200 });
}
