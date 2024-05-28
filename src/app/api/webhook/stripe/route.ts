import stripe from "stripe";
import { recordTransferEvent } from "@/lib/db";
import { getConfig } from "@/lib/lib";
import { Wallet, ethers } from "ethers";
import { BundlerService } from "@/lib/4337";
import accountFactoryContractAbi from "smartcontracts/build/contracts/accfactory/AccountFactory.abi.json";

export async function POST(request) {
  const sig = request.headers.get("stripe-signature");

  const body = await request.text();

  try {
    const stripeSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripeSecret) {
      throw new Error("Stripe secret not found");
    }

    const event = stripe.webhooks.constructEvent(body, sig, stripeSecret);

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        const communitySlug: string | undefined | null =
          event?.data?.object?.metadata?.communitySlug;
        if (!communitySlug) {
          throw new Error(`Community not found (${communitySlug})`);
        }

        const config = await getConfig(communitySlug);
        if (!config) {
          throw new Error(`Community not found (${communitySlug})`);
        }

        let amount = event?.data?.object?.metadata?.amount;
        if (!amount) {
          amount = "0";
        }

        const row = {
          communitySlug,
          processor: "stripe",
          processor_id: event.data.object.id,
          amount: parseInt(amount),
          currency: event.data.object.currency,
          accountAddress: event.data.object.client_reference_id,
          chain: null,
          data: event.data.object,
          signature: null,
        };

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

        const signature = await bundler.sendERC20Token(
          signer,
          config.token.address,
          sender,
          row.accountAddress,
          `${Math.round(row.amount)}`,
          "top up"
        );

        row.signature = signature;

        if (process.env.POSTGRES_URL && process.env.NODE_ENV === "production") {
          recordTransferEvent(row);
        }

        break;
      // ... handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (err) {
    console.log("!!! ERROR", err.message, JSON.stringify(err, null, 2));
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Return a 200 response to acknowledge receipt of the event
  return new Response("ok", { status: 200 });
}
