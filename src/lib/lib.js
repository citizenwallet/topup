import { gzipSync } from "zlib";
import { Buffer } from "buffer";
import topupProdConfig from "../config.json";
import topupTestConfig from "../config.test.json";

const topupConfig =
  process.env.NODE_ENV === "production" ? topupProdConfig : topupTestConfig;

const configUrl =
  process.env.NODE_ENV === "production"
    ? "https://config.internal.citizenwallet.xyz/v3/communities.json"
    : `${process.env.NEXT_PUBLIC_WEBSITE_URL}/communities.test.json`;

console.log(">>> configUrl", configUrl);

export function compress(data) {
  // console.log(">>> typeof data", typeof data, data);
  const encodedData = Buffer.from(data, "utf8");
  const gzippedData = gzipSync(encodedData, { level: 6 });
  const base64Data = gzippedData
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return base64Data;
}

let config;
async function loadClientConfig() {
  if (config) return Promise.resolve(config);
  const res = await fetch(`${process.env.NEXT_PUBLIC_WEBSITE_URL}/api/config`);
  config = await res.json();
  return config;
}
export async function loadConfig() {
  if (config) return Promise.resolve(config);
  const res = await fetch(configUrl);
  config = await res.json();

  return config;
}
export async function getClientConfig(communitySlug) {
  const communities = await loadClientConfig();
  if (!communitySlug) return communities;
  return communities.find((c) => c.community.alias === communitySlug);
}

export async function getConfig(communitySlug) {
  const communities = await loadConfig();
  if (!communitySlug) return communities;
  return communities.find((c) => c.community.alias === communitySlug);
}

export function getPlugin(communitySlug, pluginSlug) {
  return topupConfig[communitySlug];
}
