import { createSign } from "crypto";

export interface WiseTransaction {
  type: string;
  date: string;
  amount: {
    value: number;
    currency: string;
    zero: boolean;
  };
  totalFees: {
    value: number;
    currency: string;
    zero: boolean;
  };
  details: {
    type: string;
    description: string;
    senderName: string;
    senderAccount: string;
    paymentReference: string;
    recipientAccountNumber: string;
    recipientAccountDetailsId: number;
  };
  exchangeDetails: null;
  runningBalance: {
    value: number;
    currency: string;
    zero: boolean;
  };
  referenceNumber: string;
  attachment: null;
  activityAssetAttributions: any[];
}

export const fetchWiseTopUps = async () => {
  const baseUrl = `${process.env.WISE_API_URL}/v1/profiles/51851934/balance-statements/85390967/statement.json`;

  const today = new Date();
  const oneWeekAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const queryParams = new URLSearchParams({
    currency: "EUR",
    intervalStart: oneWeekAgo.toISOString(),
    intervalEnd: today.toISOString(),
    type: "COMPACT",
  });

  const url = `${baseUrl}?${queryParams.toString()}`;

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.WISE_API_KEY}`,
  };

  // the first request returns a 403, so we need to make it twice
  let response = await fetch(url, { headers });
  if (response.status === 403) {
    console.log("!!! wise top ups 403, signing 2FA");
    const approval2fa = response.headers.get("x-2fa-approval");

    const signature = sign2FA(approval2fa);

    headers["x-2fa-approval"] = approval2fa;
    headers["X-Signature"] = signature;
  }

  console.log("!!! wise top ups fetching", url);

  response = await fetch(url, { headers });
  if (response.status !== 200) {
    console.log("!!! wise top ups fetching failed", response.statusText);
    throw new Error(`Failed to fetch wise top ups: ${response.statusText}`);
  }

  const data = await response.json();

  console.log("!!! wise top ups data", data);

  const transactions = data["transactions"] as WiseTransaction[];

  return transactions.filter(
    (transaction) =>
      transaction.type === "CREDIT" &&
      transaction.amount.zero === false &&
      transaction.details.paymentReference?.startsWith("CW")
  );
};

function sign2FA(approval2fa: string): string {
  const privateKey = process.env.WISE_PRIVATE_KEY;
  const sign = createSign("SHA256");
  sign.update(approval2fa);
  return sign.sign(privateKey, "base64");
}
