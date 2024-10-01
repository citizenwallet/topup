import { generateUniqueId } from "../lib/bank";

describe("bank.test.ts", () => {
  it("generateUniqueId", () => {
    const id = generateUniqueId(
      "0x5566D6D4Df27a6fD7856b7564F81266863Ba3ee8",
      "wallet.pay.brussels"
    );
    expect(id).toEqual("CW7D92B476");
  });
});
