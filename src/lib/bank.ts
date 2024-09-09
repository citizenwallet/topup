import { ethers } from "ethers";

function base62Encode(buffer: Buffer) {
  const chars =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  let num = BigInt("0x" + buffer.toString("hex"));

  while (num > 0) {
    const remainder = Number(num % 62n);
    result = chars[remainder] + result;
    num = num / 62n;
  }

  return result;
}

export function generateUniqueId(ethAddress: string, arbitraryString: string) {
  // Combine Ethereum address and arbitrary string
  const input = `${ethAddress}${arbitraryString}`;

  // Hash using Keccak256
  const hash = ethers.keccak256(ethers.toUtf8Bytes(input));

  // Convert the hash from hex to buffer and truncate to first 208 bits (26 hex chars)
  const truncatedBuffer = Buffer.from(hash.slice(2, 2 + 52), "hex"); // 52 hex chars = 208 bits

  // Encode the truncated hash in Base62 to make it shorter
  const base62Id = base62Encode(truncatedBuffer);

  // Return the first 35 characters (or full string if shorter)
  return `CW${base62Id.slice(0, 33)}`;
}

// Example usage
const ethAddress = "0x1234567890abcdef1234567890abcdef12345678";
const arbitraryString = "example";
const uniqueId = generateUniqueId(ethAddress, arbitraryString);
