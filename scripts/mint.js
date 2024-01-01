import { mint } from "../src/lib/mint.js";
import dotenv from "dotenv";

dotenv.config({
  path: "./.env.local",
});

async function run(amount, to) {
  await mint(amount, to);
}

run(process.argv[2], process.argv[3]);
