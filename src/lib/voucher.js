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

import AccountFactoryAbi from "smartcontracts/build/contracts/accfactory/AccountFactory.abi.json";

function getCreator(slug) {
  if (slug === "wallet.pay.brussels") {
    return "0xB16bBC7Bc0F01C49138053Ef5CDBcFDe53bD4F5E";
  } else {
    return process.env.NEXT_PUBLIC_FAUCET_ACCOUNT;
  }
}

const V1_COMMUNITIES = ["zinne"];
const voucherName = "Top up your account"; // This will appear above the token logo when redeeming the voucher

async function v1Voucher(slug, voucherWallet) {
  const encryptedWallet = await voucherWallet.encrypt(
    process.env.NEXT_PUBLIC_VOUCHER_SECRET,
    {
      scrypt: { N: 2 },
    }
  );

  const creator = getCreator(slug);
  const params = `alias=${slug}&creator=${creator}&name=${voucherName}`;

  const voucher = `voucher=${compress(encryptedWallet)}&params=${compress(
    params
  )}&alias=${slug}`;

  return voucher;
}

function v2Voucher(slug, voucherWallet, account) {
  const { privateKey } = voucherWallet;
  const creator = getCreator(slug);
  const params = `alias=${slug}&creator=${creator}&name=${voucherName}&account=${account}`;
  const voucher = `voucher=${compress(`v2-${privateKey}`)}&params=${compress(
    params
  )}&alias=${slug}`;

  return voucher;
}

export async function createVoucher(communitySlug) {
  const config = await getClientConfig(communitySlug);

  const communityUrl = `${config.community.alias}.citizenwallet.xyz`;

  const provider = new ethers.JsonRpcProvider(config.node.url);

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

  console.log(
    ">>> Getting voucher account address for publicAddress",
    voucherWallet.address
  );
  console.log("using AccountFactoryAddress", AccountFactoryAddress);
  const voucherAccountAddress = await accountFactory.getAddress(
    voucherWallet.address,
    0
  );
  console.log(">>> voucherAccountAddress", voucherAccountAddress);

  const voucher = isV1Voucher
    ? await v1Voucher(communitySlug, voucherWallet)
    : v2Voucher(communitySlug, voucherWallet, voucherAccountAddress);

  let voucherUrl;
  if (process.env.NODE_ENV === "development") {
    voucherUrl = `${process.env.NEXT_PUBLIC_WALLET_APP_URL}/#/?${voucher}`;
  } else {
    voucherUrl = `https://${communityUrl}/#/?${voucher}`;
  }
  console.log(">>> voucherUrl", voucherUrl);
  return {
    voucherUrl,
    voucherAccountAddress,
  };
}
