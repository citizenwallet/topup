import { ethers } from "ethers";
import { compress } from "../../../lib/lib";

import AccountFactoryAbi from "../../../smartcontracts/AccountFactory.abi.json";
import TokenContractAbi from "../../../smartcontracts/erc20.abi.json";

const AccountFactoryAddress = "0x9406Cc6185a346906296840746125a0E44976454";
const tokenContractAddress = "0xBABCf159c4e3186cf48e4a48bC0AeC17CF9d90FE"; // mumbai
const tokenDecimals = 6;
const voucherValue = 10;
const communitySlug = "app"; // USDC on Polygon
const communityUrl = "app.citizenwallet.xyz"; // USDC on Polygon

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
    faucetWallet.address,
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

  const encryptedWallet = await voucherWallet.encrypt(
    process.env.VOUCHER_SECRET,
    {
      scrypt: { N: 2 },
    }
  );

  const voucherName = "My Voucher of 10 USDC"; // This will appear above the token logo when redeeming the voucher

  const params = `alias=${communitySlug}&creator=${faucetAccountAddress}&name=${voucherName}`;

  const voucher = `voucher=${compress(encryptedWallet)}&params=${compress(
    params
  )}&alias=${communitySlug}`;

  const voucherUrl = `https://${communityUrl}/#/?${voucher}`;

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
