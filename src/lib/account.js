"use server";

import { ethers } from "ethers";

if (!process.env.NEXT_PUBLIC_ACCOUNT_FACTORY_ADDRESS) {
  console.error("!!! NEXT_PUBLIC_ACCOUNT_FACTORY_ADDRESS not set");
  process.exit(0);
}

import AccountFactoryAbi from "@/smartcontracts/AccountFactory.abi.json";
const AccountFactoryAddress = process.env.NEXT_PUBLIC_ACCOUNT_FACTORY_ADDRESS;

export async function getAccountForWalletAddress(walletAddress) {
  console.log(
    ">>> process.env.POLYGON_MUMBAI_RPC_URL",
    process.env.POLYGON_MUMBAI_RPC_URL
  );
  console.log(">>> get account for wallet address", walletAddress);

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
