import { Pool } from "pg";
import format from "pg-format";
import fs from "fs";

export const db = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PASSWORD,
  port: 5432,
});

export let client = null;

export async function dbconnect() {
  if (!client) {
    client = await db.connect();
  }
  return client;
}

export const dbclose = async function () {
  if (!client) return;
  await client.end();
};

export async function dbreset() {
  if (!client) throw new Error("db not connected");
  if (process.env.NODE_ENV !== "test") throw new Error("not in test mode");
  if (process.env.POSTGRES_DATABASE.indexOf("_test") === -1)
    throw new Error("Can only be used on a test database");
  const ddl = fs.readFileSync("./db.ddl.sql", "utf8");
  await client.query(ddl);
}

db.delete = async function (table, id) {
  await dbconnect();
  const res = await client.query(`DELETE FROM ${table} WHERE id='${id}'`);
  return res;
};

db.insert = async function (table, data) {
  // console.log(">>> lib/db.insert", table, data);
  await dbconnect();
  delete data.id;
  const keys = Object.keys(data);
  const values = Object.values(data);
  const text = `INSERT INTO ${table}("${keys.join('", "')}") VALUES(${keys
    .map((_, i) => "$" + (i + 1))
    .join(", ")}) RETURNING *`;
  const query = format(text, ...values);
  try {
    const res = await client.query(query, values);
    return res;
  } catch (e) {
    console.log(">>> query", query);
    console.log("!!! error", e);
  }
};

db.select = async function (table, fields, where, options) {
  await dbconnect();
  let query = `SELECT ${
    typeof fields === "string" ? fields : fields.join(", ")
  } FROM ${table}`;

  if (where && Object.keys(where).length > 0) {
    query += ` WHERE ${Object.keys(where)
      .map((key, i) => `"${key}"=%L`)
      .join(" AND ")}`;
    query = format(query, ...Object.values(where));
  }

  if (options && options.limit) {
    query += ` LIMIT ${parseInt(options.limit, 10)}`;
  }

  return await client.query(query);
};

db.update = async function (table, data) {
  if (!data.id) throw new Error("data.id is required");
  const keys = [],
    values = [];

  for (const [key, value] of Object.entries(data)) {
    if (key === "id") continue;
    if (value === "undefined") continue;
    keys.push(key);
    values.push(value);
  }

  const text = `UPDATE ${table} SET ${keys
    .map((key, i) => `"${key}"=%L`)
    .join(", ")} WHERE id='${data.id}' RETURNING *`;

  const query = format(text, ...values);
  // console.log(">>> update query", query, "values", values);
  try {
    const res = await client.query(query);
    return res;
  } catch (e) {
    console.log("!!! error", e);
  }
};

export async function recordTransferEvent(event) {
  if (!process.env.POSTGRES_URL) {
    console.log("!!! POSTGRES_URL not set, skipping recording the event");
    return;
  }

  event.event = "transfer";
  console.log(">>> recordTransferEvent", event);

  try {
    const res = await db.insert("blockchain_events", event);
  } catch (e) {
    console.log("!!! error", e);
  }
}
