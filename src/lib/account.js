"use server";

import { ethers } from "ethers";
import { getConfig } from "@/lib/lib";

if (!process.env.NEXT_PUBLIC_ACCOUNT_FACTORY_ADDRESS) {
  console.error("!!! NEXT_PUBLIC_ACCOUNT_FACTORY_ADDRESS not set");
  process.exit(0);
}

import AccountFactoryAbi from "@/smartcontracts/AccountFactory.abi.json";
const AccountFactoryAddress = process.env.NEXT_PUBLIC_ACCOUNT_FACTORY_ADDRESS;

export async function getAccountForWalletAddress(walletAddress, communitySlug) {
  console.log(
    ">>> get account for wallet address",
    walletAddress,
    communitySlug
  );
  const config = await getConfig(communitySlug);
  const provider = new ethers.providers.JsonRpcProvider({
    url: process.env.NEXT_PUBLIC_RPC_URL,
    skipFetchSetup: true,
  });

  const accountFactory = new ethers.Contract(
    AccountFactoryAddress,
    AccountFactoryAbi,
    provider
  );
  const voucherAccountAddress = await accountFactory.getAddress(
    walletAddress,
    0
  );
  return voucherAccountAddress;
}
