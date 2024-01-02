import { sql } from "@vercel/postgres";

export async function recordStripeEvent(event) {
  const client = await sql.connect();
  const query = {
    text: `INSERT INTO stripe_events ("${Object.keys(event).join(
      '","'
    )}") VALUES (${Object.keys(event)
      .map((r, i) => `\$${i + 1}`)
      .join(",")}) RETURNING *`,
    values: Object.values(event),
  };
  // console.log(">>> query", query);

  try {
    const { rows } = await client.query(query.text, query.values);
  } catch (e) {
    console.log("!!! error", e);
  }
  await client.end();
}
