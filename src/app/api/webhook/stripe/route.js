import stripe from "stripe";
import { sql } from "@vercel/postgres";
import { mint } from "src/lib/mint";

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
      console.log(">>> event.type", event.type);

      const row = {
        processor: "stripe",
        processor_id: event.data.object.id,
        amount: event.data.object.amount_total,
        currency: event.data.object.currency,
        accountAddress: event.data.object.client_reference_id,
        chain: null,
        data: event.data.object,
      };

      row.txHash = await mint(
        (row.amount * 10 ** decimals) / 100,
        row.accountAddress
      );
      const client = await sql.connect();
      const query = {
        text: `INSERT INTO mint_events ("${Object.keys(row).join(
          '","'
        )}") VALUES (${Object.keys(row)
          .map((r, i) => `\$${i + 1}`)
          .join(",")}) RETURNING *`,
        values: Object.values(row),
      };
      console.log(">>> query", query);

      try {
        const { rows } = await client.query(query.text, query.values);
      } catch (e) {
        console.log("!!! error", e);
      }
      await client.end();

      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  return new Response("ok", { status: 200 });
}
