import { gzipSync } from "zlib";
import { Buffer } from "buffer";
import { encode } from "urlsafe-base64";

export function base64UrlEncode(input) {
  // Encode the input string as UTF-8 bytes
  const encoder = new TextEncoder();
  const data = encoder.encode(input);

  // Convert the UTF-8 bytes to base64
  const base64 = btoa(String.fromCharCode.apply(null, data));

  // Replace characters that are not URL-safe
  const urlSafeBase64 = base64
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return urlSafeBase64;
}

export function compress(data) {
  // console.log(">>> typeof data", typeof data, data);
  const encodedData = Buffer.from(data, "utf8");
  const gzippedData = gzipSync(encodedData, { level: 6 });
  const base64Data = base64UrlEncode(gzippedData);
  return base64Data;
}
