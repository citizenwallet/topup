import { ethers } from "ethers";
import { compress } from "./lib";

if (!process.env.NEXT_PUBLIC_VOUCHER_SECRET) {
  console.error("!!! NEXT_PUBLIC_VOUCHER_SECRET not set");
  process.exit(0);
}

if (!process.env.NEXT_PUBLIC_FAUCET_ACCOUNT) {
  console.error("!!! NEXT_PUBLIC_FAUCET_ACCOUNT not set");
  process.exit(0);
}

import AccountFactoryAbi from "@/smartcontracts/AccountFactory.abi.json";
const AccountFactoryAddress = process.env.NEXT_PUBLIC_ACCOUNT_FACTORY_ADDRESS;

export async function createVoucher(community) {
  const communitySlug = community.slug;
  const communityUrl = community.url;

  const provider = new ethers.providers.JsonRpcProvider({
    url: process.env.NEXT_PUBLIC_RPC_URL,
    skipFetchSetup: true,
  });

  const voucherWallet = ethers.Wallet.createRandom();

  const accountFactory = new ethers.Contract(
    AccountFactoryAddress,
    AccountFactoryAbi,
    provider
  );

  const voucherAccountAddress = await accountFactory.getAddress(
    voucherWallet.address,
    0
  );

  const encryptedWallet = await voucherWallet.encrypt(
    process.env.NEXT_PUBLIC_VOUCHER_SECRET,
    {
      scrypt: { N: 2 },
    }
  );

  const voucherName = "Top up your account"; // This will appear above the token logo when redeeming the voucher

  const params = `alias=${communitySlug}&creator=${process.env.NEXT_PUBLIC_FAUCET_ACCOUNT}&name=${voucherName}`;

  const voucher = `voucher=${compress(encryptedWallet)}&params=${compress(
    params
  )}&alias=${communitySlug}`;

  const voucherUrl = `https://${communityUrl}/#/?${voucher}`;
  console.log(">>> voucherUrl", voucherUrl);
  return {
    voucherUrl,
    voucherAccountAddress,
  };
}
