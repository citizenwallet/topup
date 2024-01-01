import { gzipSync } from "zlib";
import { Buffer } from "buffer";

export function compress(data) {
  const encodedData = Buffer.from(data, "utf8");
  const gzippedData = gzipSync(encodedData, { level: 6 });
  const base64Data = gzippedData
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return base64Data;
}
