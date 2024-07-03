"use server";

import { ethers } from "ethers";
import { getConfig } from "@/lib/lib";

import AccountFactoryAbi from "smartcontracts/build/contracts/accfactory/AccountFactory.abi.json";

export async function getAccountForWalletAddress(walletAddress, communitySlug) {
  console.log(
    ">>> get account for wallet address",
    walletAddress,
    communitySlug
  );
  const config = await getConfig(communitySlug);
  const AccountFactoryAddress = config.erc4337.account_factory_address;
  const provider = new ethers.JsonRpcProvider(config.node.url);

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
