import { ethers } from "ethers";
import { compress } from "../../../lib/lib";

import AccountFactoryAbi from "../../../smartcontracts/AccountFactory.abi.json";
import TokenContractAbi from "../../../smartcontracts/erc20.abi.json";

const AccountFactoryAddress = "0x9406Cc6185a346906296840746125a0E44976454";
const tokenContractAddress = "0xBABCf159c4e3186cf48e4a48bC0AeC17CF9d90FE"; // mumbai
const tokenDecimals = 6;
const voucherValue = 10;
const communitySlug = "eure.polygon";
const communityUrl = "eure.polygon.citizenwallet.xyz";

export async function GET(request) {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.POLYGON_MUMBAI_RPC_URL
  );
  const voucherWallet = ethers.Wallet.createRandom();

  const faucetWallet = new ethers.Wallet(
    process.env.FAUCET_PRIVATE_KEY,
    provider
  );

  const connectedFaucetWallet = faucetWallet.connect(provider);

  const tokenContract = new ethers.Contract(
    tokenContractAddress,
    TokenContractAbi,
    provider
  );

  const accountFactory = new ethers.Contract(
    AccountFactoryAddress,
    AccountFactoryAbi,
    provider
  );

  const faucetAccountAddress = await accountFactory.getAddress(
    process.env.FAUCET_PUBLIC_KEY,
    0
  );

  const voucherAccountAddress = await accountFactory.getAddress(
    voucherWallet.address,
    0
  );

  console.log(
    ">>> transfering tokens from",
    faucetWallet.address,
    "faucet EOA wallet to voucher",
    voucherAccountAddress
  );

  const amountToSend = ethers.utils.parseUnits(
    `${voucherValue}`,
    tokenDecimals
  );

  try {
    const tx = await tokenContract
      .connect(faucetWallet)
      .transfer(voucherAccountAddress, amountToSend);
    console.log("Transaction Hash:", tx.hash);
    const receipt = await tx.wait();
    console.log("Transaction Mined in Block:", receipt.blockNumber);
  } catch (e) {
    console.log(
      "!!! error transfering tokens to voucher",
      voucherAccountAddress,
      e
    );
  }

  const encryptedWallet = await voucherWallet.encrypt(process.env.SECRET, {
    scrypt: { N: 2 },
  });

  const params = `alias=${communitySlug}&creator=${process.env.FAUCET_PUBLIC_KEY}`;
  console.log(">>> encryptedWallet", encryptedWallet);
  console.log(">>> compressed", compress(encryptedWallet));
  console.log(">>> compressed params", compress(params));

  //        '$appLink/#/?voucher=$encoded&params=$encodedParams&alias=$alias';

  const voucherUrl = `https://${communityUrl}/#/?voucher=${compress(
    encryptedWallet
  )}&params=${compress(params)}&alias=${communitySlug}`;

  const res = {
    faucetAccountAddress,
    voucherAccountAddress,
    voucherUrl,
  };

  return new Response(JSON.stringify(res), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
