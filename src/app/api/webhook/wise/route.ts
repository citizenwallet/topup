import { getConfig, getPlugin } from "@/lib/lib";
import { Wallet, ethers } from "ethers";
import { BundlerService } from "@citizenwallet/sdk/dist/src/services/bundler";
import accountFactoryContractAbi from "smartcontracts/build/contracts/accfactory/AccountFactory.abi.json";
import { kv } from "@vercel/kv";
import crypto from "crypto";
import { fetchWiseTopUps, WiseTransaction } from "./utils";

const sandboxPublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwpb91cEYuyJNQepZAVfP
ZIlPZfNUefH+n6w9SW3fykqKu938cR7WadQv87oF2VuT+fDt7kqeRziTmPSUhqPU
ys/V2Q1rlfJuXbE+Gga37t7zwd0egQ+KyOEHQOpcTwKmtZ81ieGHynAQzsn1We3j
wt760MsCPJ7GMT141ByQM+yW1Bx+4SG3IGjXWyqOWrcXsxAvIXkpUD/jK/L958Cg
nZEgz0BSEh0QxYLITnW1lLokSx/dTianWPFEhMC9BgijempgNXHNfcVirg1lPSyg
z7KqoKUN0oHqWLr2U1A+7kqrl6O2nx3CKs1bj1hToT1+p4kcMoHXA7kA+VBLUpEs
VwIDAQAB
-----END PUBLIC KEY-----`;

const productionPublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvO8vXV+JksBzZAY6GhSO
XdoTCfhXaaiZ+qAbtaDBiu2AGkGVpmEygFmWP4Li9m5+Ni85BhVvZOodM9epgW3F
bA5Q1SexvAF1PPjX4JpMstak/QhAgl1qMSqEevL8cmUeTgcMuVWCJmlge9h7B1CS
D4rtlimGZozG39rUBDg6Qt2K+P4wBfLblL0k4C4YUdLnpGYEDIth+i8XsRpFlogx
CAFyH9+knYsDbR43UJ9shtc42Ybd40Afihj8KnYKXzchyQ42aC8aZ/h5hyZ28yVy
Oj3Vos0VdBIs/gAyJ/4yyQFCXYte64I7ssrlbGRaco4nKF3HmaNhxwyKyJafz19e
HwIDAQAB
-----END PUBLIC KEY-----
`;

const publicKey = crypto.createPublicKey({
  key:
    process.env.VERCEL_ENV === "production"
      ? productionPublicKey
      : sandboxPublicKey,
  format: "pem",
});

interface AccountSlugData {
  account: string;
  community: string;
}

export async function POST(request: Request) {
  try {
    const signatureHeader = request.headers.get("X-Signature-SHA256");
    if (!signatureHeader) {
      throw new Error("X-Signature-SHA256 header missing");
    }

    const webhookBody = await request.text();

    console.log("webhookBody", webhookBody);

    const isVerified = crypto.verify(
      "RSA-SHA256",
      Buffer.from(webhookBody),
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      Buffer.from(signatureHeader, "base64")
    );

    console.log("!!! isVerified", isVerified);

    if (!isVerified) {
      throw new Error("Webhook payload not verified");
    }

    const transactions = await fetchWiseTopUps();

    console.log("!!! transactions", transactions);
    for (const transaction of transactions) {
      const processed = await kv.get<boolean>(
        `wise_processed_${transaction.referenceNumber}`
      );

      if (processed) {
        continue;
      }

      await processTransaction(transaction);
    }
  } catch (err) {
    console.log("!!! ERROR", err.message, JSON.stringify(err, null, 2));
    return new Response(`Webhook Error: ${err.message}`, { status: 500 });
  }

  // Return a 200 response to acknowledge receipt of the event
  return new Response("ok", { status: 200 });
}

const processTransaction = async (transaction: WiseTransaction) => {
  const accountSlug = transaction.details.paymentReference;
  const amount = transaction.amount.value;

  // get the community config
  const rawAccountSlugData = await kv.get<string>(
    `account_slug_${accountSlug}`
  );
  if (!rawAccountSlugData) {
    throw new Error(`Account slug data not found for ${accountSlug}`);
  }

  console.log("!!! rawAccountSlugData", rawAccountSlugData);

  let accountSlugData: AccountSlugData;
  try {
    accountSlugData = rawAccountSlugData as unknown as AccountSlugData;
  } catch (error) {
    console.log("!!! error", error);
    return;
  }

  const { account, community: communitySlug } = accountSlugData;

  const config = await getConfig(communitySlug);
  if (!config) {
    throw new Error(`Config not found for ${communitySlug}`);
  }

  const pluginConfig = getPlugin(communitySlug, "topup");

  if (!config.node) {
    console.error("Config.node missing", config);
    throw new Error(`Config.node missing for ${communitySlug}`);
  }

  const provider = new ethers.JsonRpcProvider(config.node.url);

  const faucetKey = process.env.FAUCET_PRIVATE_KEY;
  if (!faucetKey) {
    throw new Error("Faucet key not found");
  }

  const faucetWallet = new Wallet(faucetKey);
  const signer = faucetWallet.connect(provider);

  const bundler = new BundlerService(config);

  const accountFactoryContract = new ethers.Contract(
    config.erc4337.account_factory_address,
    accountFactoryContractAbi,
    provider
  );

  const sender = await accountFactoryContract.getFunction("getAddress")(
    signer.address,
    0
  );

  const topUpMessage = `Top up from ${transaction.details.senderName} - ${transaction.details.senderAccount}`;

  console.log("!!! topUpMessage", topUpMessage);

  if (pluginConfig.mode === "mint") {
    try {
      console.log(
        `Minting ${amount} ${config.token.symbol} tokens for ${account}`
      );
      await bundler.mintERC20Token(
        signer,
        config.token.address,
        sender,
        account,
        `${Math.round(amount)}`,
        topUpMessage
      );

      await kv.set(`wise_processed_${transaction.referenceNumber}`, true);
    } catch (e) {
      console.log("!!! wise webhook bundler.mintERC20Token error", e);
      return;
    }
  } else {
    console.log(
      `Sending ${amount} ${config.token.symbol} tokens to ${account}`
    );
    try {
      await bundler.sendERC20Token(
        signer,
        config.token.address,
        sender,
        account,
        `${Math.round(amount)}`,
        topUpMessage
      );

      await kv.set(`wise_processed_${transaction.referenceNumber}`, true);
    } catch (error) {
      console.log("!!! wise webhook bundler.sendERC20Token error", error);
      return;
    }
  }
};
