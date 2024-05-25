import { getConfig, getPlugin } from "@/lib/lib";
import { recordTransferEvent } from "@/lib/db";
import { redirect } from "next/navigation";
import { userOpERC20Transfer } from "@/lib/4337";
import { Wallet, ethers } from "ethers";

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

async function createStripeCheckoutSession(
  client_reference_id,
  line_items,
  { cancel_url, success_url, metadata }
) {
  const request = {
    client_reference_id,
    cancel_url,
    line_items,
    mode: "payment",
    success_url,
    metadata,
  };
  console.log(">>> stripe session request", request);
  const session = await stripe.checkout.sessions.create(request);

  return session;
}

function setUrl(urlString, key) {
  const newProtocol = "https:";
  const url = urlString.replace(/(^\w+:|^)\/\//, `${newProtocol}//`);

  const urlObject = new URL(url);
  urlObject.searchParams.set(key, true);
  urlObject.search = urlObject.searchParams.toString();

  return urlObject.toString();
}

export async function GET(request, { params }) {
  const searchParams = request.nextUrl.searchParams;
  const accountAddress = searchParams.get("accountAddress");
  const redirectUrl = searchParams.get("redirectUrl");
  const communitySlug = params.communitySlug;
  const amount = parseInt(params.amount, 10); // amount in units

  function error(message) {
    redirect(
      `${process.env.NEXT_PUBLIC_WEBSITE_URL}/${communitySlug}?error=${message}`
    );
  }

  const internalRedirectUrl = `${process.env.NEXT_PUBLIC_WEBSITE_URL}/${params.communitySlug}/voucher`;

  const pluginConfig = getPlugin(params.communitySlug, "topup");

  if (!pluginConfig.stripe) {
    const row = {
      communitySlug,
      processor: "topup",
      amount,
      accountAddress,
      chain: null,
    };

    console.log(">>> topup", row);

    try {
      const config = await getConfig(communitySlug);
      if (!config) {
        throw new Error(`Community not found (${communitySlug})`);
      }

      const provider = new ethers.JsonRpcProvider(config.node.url);

      const faucetWallet = new Wallet(process.env.FAUCET_PRIVATE_KEY);
      const signer = faucetWallet.connect(provider);

      const signature = await userOpERC20Transfer(
        config,
        provider,
        signer,
        accountAddress,
        amount
      );

      row.signature = signature;
    } catch (e) {
      console.log("!!! topup error", e);
      return error(e.message);
    }

    if (process.env.POSTGRES_URL) {
      recordTransferEvent(row);
    }

    redirect(redirectUrl ?? `${internalRedirectUrl}?success=true`);
  }

  let prices = pluginConfig.stripe.prices;
  let selectedPack = pluginConfig.packages.find((pkg) => pkg.amount === amount);
  if (selectedPack && selectedPack.stripe) {
    prices = selectedPack.stripe.prices;
  }

  const line_items = [
    {
      price: prices.unit,
      quantity: amount,
    },
  ];

  if (prices.fees) {
    line_items.push({
      price: prices.fees,
      quantity: 1,
    });
  }

  const session = await createStripeCheckoutSession(
    accountAddress,
    line_items,
    {
      cancel_url: setUrl(redirectUrl ?? internalRedirectUrl, "cancelled"),
      success_url: setUrl(redirectUrl ?? internalRedirectUrl, "success"),
      metadata: {
        communitySlug,
        amount,
        accountAddress,
      },
    }
  );

  redirect(session.url);
}
