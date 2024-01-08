import { ethers } from "ethers";
import { compress, getConfig } from "./lib";
if (!process.env.NEXT_PUBLIC_VOUCHER_SECRET) {
  console.error("!!! NEXT_PUBLIC_VOUCHER_SECRET not set");
  process.exit(0);
}

if (!process.env.NEXT_PUBLIC_FAUCET_ACCOUNT) {
  console.error("!!! NEXT_PUBLIC_FAUCET_ACCOUNT not set");
  process.exit(0);
}

import AccountFactoryAbi from "@/smartcontracts/AccountFactory.abi.json";

export async function createVoucher(communitySlug) {
  const config = await getConfig(communitySlug);

  // Uncomment when upgrading to voucher-v2
  // const AccountFactoryAddress = config.erc4337.account_factory_address;
  const AccountFactoryAddress = "0x9406Cc6185a346906296840746125a0E44976454"; // Ethereum account factory address

  const communityUrl = `${config.community.alias}.citizenwallet.xyz`;

  const provider = new ethers.providers.JsonRpcProvider({
    url: config.node.url,
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
