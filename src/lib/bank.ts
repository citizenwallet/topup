import { ethers } from "ethers";

export function generateUniqueId(
  ethAddress: string,
  arbitraryString: string
): string {
  // Combine Ethereum address and arbitrary string
  const input = `${ethAddress}${arbitraryString}`;

  // Hash using Keccak256
  const hash = ethers.keccak256(ethers.toUtf8Bytes(input));

  // Extract first 4 characters and last 4 characters from the hash
  const first4 = hash.slice(2, 6).toUpperCase();
  const last4 = hash.slice(-4).toUpperCase();

  // Combine the parts
  return `CW${first4}${last4}`;
}
