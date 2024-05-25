import stripe from "stripe";
import { recordTransferEvent } from "@/lib/db";
import { getConfig } from "@/lib/lib";
import { Wallet, ethers } from "ethers";
import { BundlerService, userOpERC20Transfer } from "@/lib/4337";
import accountFactoryContractAbi from "smartcontracts/build/contracts/accfactory/AccountFactory.abi.json";

function getCommunitySlugFromUrl(url) {
  const urlObject = new URL(url);
  return urlObject.searchParams.get("alias");
}

export async function POST(request) {
  const sig = request.headers.get("stripe-signature");
  const body = await request.text();

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log("!!! ERROR", err.message, JSON.stringify(err, null, 2));
    return Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      // const communitySlug = getCommunitySlugFromUrl(
      //   event.data.object.success_url
      // );
      // const communitySlug = "wallet.pay.brussels"; // HARDCODED FIX IT
      const communitySlug = "bread"; // HARDCODED FIX IT
      const row = {
        communitySlug,
        processor: "stripe",
        processor_id: event.data.object.id,
        amount: parseInt(event.data.object.metadata.amount),
        currency: event.data.object.currency,
        accountAddress: event.data.object.client_reference_id,
        chain: null,
        data: event.data.object,
      };

      const config = await getConfig(communitySlug);
      if (!config) {
        throw new Error(`Community not found (${communitySlug})`);
      }

      if (!config.node) {
        console.error("Config.node missing", config);
        throw new Error(`Config.node missing for ${communitySlug}`);
      }

      const provider = new ethers.JsonRpcProvider(config.node.url);

      const faucetWallet = new Wallet(process.env.FAUCET_PRIVATE_KEY);
      const signer = faucetWallet.connect(provider);

      const bundler = new BundlerService(config);

      const accountFactoryContract = new ethers.Contract(
        config.erc4337.account_factory_address,
        accountFactoryContractAbi,
        provider
      );

      const sender = await accountFactoryContract.getAddress(signer.address, 0);

      const signature = await bundler.sendERC20Token(
        signer,
        config.token.address,
        sender,
        row.accountAddress,
        row.amount,
        "top up"
      );

      row.signature = signature;

      if (process.env.POSTGRES_URL) {
        recordTransferEvent(row);
      }

      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  return new Response("ok", { status: 200 });
}
