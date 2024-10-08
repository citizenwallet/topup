import { getConfig, getPlugin } from "@/lib/lib";
import { recordTransferEvent } from "@/lib/db";
import { redirect } from "next/navigation";
import { BundlerService } from "@citizenwallet/sdk/dist/src/services/bundler";
import { Wallet, ethers } from "ethers";
import accountFactoryContractAbi from "smartcontracts/build/contracts/accfactory/AccountFactory.abi.json";
import { Stripe } from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createStripeCheckoutSession(
  client_reference_id: string,
  line_items: Stripe.Checkout.SessionCreateParams.LineItem[],
  { cancel_url, success_url, metadata }
) {
  const request: Stripe.Checkout.SessionCreateParams = {
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
  urlObject.searchParams.set(key, "true");
  urlObject.search = urlObject.searchParams.toString();

  return urlObject.toString();
}

export async function GET(request, { params }) {
  const searchParams = request.nextUrl.searchParams;
  const title = searchParams.get("title");
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

  const topupConfig = getPlugin(params.communitySlug, "topup");

  const config = await getConfig(communitySlug);
  if (!config) {
    throw new Error(`Community not found (${communitySlug})`);
  }

  if (!topupConfig.stripe) {
    const row = {
      communitySlug,
      processor: "topup",
      amount,
      accountAddress,
      chain: null,
      signature: null,
    };

    let bundler;
    try {
      bundler = new BundlerService(config);
    } catch (e) {
      console.log("!!! new BundlerService error", e);
      return error(e.message);
    }
    const provider = new ethers.JsonRpcProvider(config.node.url);

    const faucetWallet = new Wallet(process.env.FAUCET_PRIVATE_KEY);
    const signer = faucetWallet.connect(provider);
    const accountFactoryContract = new ethers.Contract(
      config.erc4337.account_factory_address,
      accountFactoryContractAbi,
      provider
    );
    console.log(">>> accountFactoryContract", accountFactoryContract);
    const sender = await accountFactoryContract.getFunction("getAddress")(
      signer.address,
      0
    );

    // const signature = await userOpERC20Transfer(
    //   config,
    //   provider,
    //   signer,
    //   accountAddress,
    //   amount
    // );

    if (topupConfig.mode === "mint") {
      try {
        const txHash = await bundler.mintERC20Token(
          signer,
          config.token.address,
          sender,
          row.accountAddress,
          `${Math.round(row.amount)}`,
          "minting"
        );

        row.signature = txHash;
      } catch (e) {
        console.log("!!! bundler.mintERC20Token error", e);
        error(e.message || "Error minting tokens");
        return;
      }
    } else {
      try {
        const txHash = await bundler.sendERC20Token(
          signer,
          config.token.address,
          sender,
          row.accountAddress,
          `${Math.round(row.amount)}`,
          "top up"
        );

        row.signature = txHash;
      } catch (e) {
        console.log("!!! bundler.sendERC20Token error", e);
        return error(e.message);
      }
    }

    if (process.env.POSTGRES_URL) {
      recordTransferEvent(row);
    }

    redirect(redirectUrl ?? setUrl(internalRedirectUrl, "success"));
  }

  // Using stripe
  let prices = topupConfig.stripe.prices;
  let selectedPack = topupConfig.packages.find((pkg) => pkg.amount === amount);
  if (selectedPack && selectedPack.stripe) {
    prices = selectedPack.stripe.prices;
  }

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
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

  console.log("metadata", {
    communitySlug,
    amount,
    accountAddress,
  });

  const metadata: Stripe.MetadataParam = {
    description:
      title || `Topping up for ${amount / 100} ${config.token.symbol}`,
    communitySlug,
    amount,
    accountAddress,
  };

  let session;
  try {
    session = await createStripeCheckoutSession(accountAddress, line_items, {
      cancel_url: setUrl(redirectUrl ?? internalRedirectUrl, "cancelled"),
      success_url: setUrl(redirectUrl ?? internalRedirectUrl, "success"),
      metadata,
    });
  } catch (e) {
    console.log("!!! stripe.createCheckoutSession error", e);
    error(e.message || "Error creating stripe session");
  }
  redirect(session.url);
}
