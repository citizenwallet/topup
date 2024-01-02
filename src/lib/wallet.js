import { ethers } from "ethers";

export function createWallet() {
  const voucherWallet = ethers.Wallet.createRandom();
  return {
    privateKey: voucherWallet.privateKey,
    address: voucherWallet.address,
  };
}
