import stripe from "stripe";
import { transfer } from "@/lib/transfer";
import { recordStripeEvent } from "@/lib/db";

const decimals = 6;

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
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      console.log(">>> processing stripe event", event.type);

      const row = {
        processor: "stripe",
        processor_id: event.data.object.id,
        amount: event.data.object.amount_total,
        currency: event.data.object.currency,
        accountAddress: event.data.object.client_reference_id,
        chain: null,
        data: event.data.object,
      };

      // Based on Stripe fees of 1.5% + 0.25 EUR
      row.amount = Math.floor(
        ((event.data.object.amount_total - 25) / 101.5) * 100
      );
      row.fees = event.data.object.amount_total - row.amount;

      row.txHash = await transfer(row.amount, row.accountAddress);

      if (process.env.POSTGRES_URL) {
        recordStripeEvent(row);
      }

      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  return new Response("ok", { status: 200 });
}
