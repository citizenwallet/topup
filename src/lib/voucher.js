"use client";

import { ethers } from "ethers";
import { compress, getClientConfig } from "./lib";
if (!process.env.NEXT_PUBLIC_VOUCHER_SECRET) {
  console.error("!!! NEXT_PUBLIC_VOUCHER_SECRET not set");
  process.exit(0);
}

if (!process.env.NEXT_PUBLIC_FAUCET_ACCOUNT) {
  console.error("!!! NEXT_PUBLIC_FAUCET_ACCOUNT not set");
  process.exit(0);
}

import AccountFactoryAbi from "@/smartcontracts/AccountFactory.abi.json";

const V1_COMMUNITIES = ["zinne"];

async function v1Voucher(slug, voucherWallet) {
  const encryptedWallet = await voucherWallet.encrypt(
    process.env.NEXT_PUBLIC_VOUCHER_SECRET,
    {
      scrypt: { N: 2 },
    }
  );

  const voucherName = "Top up your account"; // This will appear above the token logo when redeeming the voucher

  const params = `alias=${slug}&creator=${process.env.NEXT_PUBLIC_FAUCET_ACCOUNT}&name=${voucherName}`;

  const voucher = `voucher=${compress(encryptedWallet)}&params=${compress(
    params
  )}&alias=${slug}`;

  return voucher;
}

function v2Voucher(slug, voucherWallet, account) {
  const { privateKey } = voucherWallet;

  const voucherName = "Top up your account"; // This will appear above the token logo when redeeming the voucher

  const params = `alias=${slug}&creator=${process.env.NEXT_PUBLIC_FAUCET_ACCOUNT}&name=${voucherName}&account=${account}`;

  const voucher = `voucher=${compress(`v2-${privateKey}`)}&params=${compress(
    params
  )}&alias=${slug}`;

  return voucher;
}

export async function createVoucher(communitySlug) {
  const config = await getClientConfig(communitySlug);

  const communityUrl = `${config.community.alias}.citizenwallet.xyz`;

  const provider = new ethers.providers.JsonRpcProvider({
    url: config.node.url,
    skipFetchSetup: true,
  });

  const voucherWallet = ethers.Wallet.createRandom();

  const isV1Voucher = V1_COMMUNITIES.includes(communitySlug);

  const AccountFactoryAddress = isV1Voucher
    ? "0x9406Cc6185a346906296840746125a0E44976454" // Ethereum account factory address
    : config.erc4337.account_factory_address;

  const accountFactory = new ethers.Contract(
    AccountFactoryAddress,
    AccountFactoryAbi,
    provider
  );

  const voucherAccountAddress = await accountFactory.getAddress(
    voucherWallet.address,
    0
  );

  const voucher = isV1Voucher
    ? v1Voucher(communitySlug, voucherWallet)
    : v2Voucher(communitySlug, voucherWallet, voucherAccountAddress);

  const voucherUrl = `https://${communityUrl}/#/?${voucher}`;
  console.log(">>> voucherUrl", voucherUrl);
  return {
    voucherUrl,
    voucherAccountAddress,
  };
}
