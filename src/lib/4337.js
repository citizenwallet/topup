import { ethers } from "ethers";
import accountFactoryContractAbi from "smartcontracts/build/contracts/accfactory/AccountFactory.abi";
import accountContractAbi from "smartcontracts/build/contracts/account/Account.abi";
import tokenContractAbi from "smartcontracts/build/contracts/erc20/ERC20.abi";

const accountFactoryInterface = new ethers.utils.Interface(
  accountFactoryContractAbi
);
const accountInterface = new ethers.utils.Interface(accountContractAbi);
const erc20Token = new ethers.utils.Interface(tokenContractAbi);

export const transferCallData = (tokenAddress, receiver, amount) =>
  accountInterface.encodeFunctionData("execute", [
    tokenAddress,
    ethers.constants.Zero,
    erc20Token.encodeFunctionData("transfer", [receiver, amount]),
  ]);

const generateNonce = () => {
  // Generate a random 24-byte value
  const randomBytes = ethers.utils.randomBytes(24);

  // Interpret the random bytes as a uint192
  const key = ethers.BigNumber.from(randomBytes);

  const seq = ethers.BigNumber.from("0");

  const nonce = key.shl(64).add(seq);

  return nonce;
};

const generateUserOp = (
  signerAddress,
  sender,
  accountFactoryAddress,
  callData
) => {
  const userop = {
    sender,
    nonce: ethers.BigNumber.from("0"),
    initCode: ethers.utils.arrayify("0x"),
    callData: ethers.utils.arrayify("0x"),
    callGasLimit: ethers.BigNumber.from("0"),
    verificationGasLimit: ethers.BigNumber.from("1500000"),
    preVerificationGas: ethers.BigNumber.from("21000"),
    maxFeePerGas: ethers.BigNumber.from("0"),
    maxPriorityFeePerGas: ethers.BigNumber.from("1000000000"),
    paymasterAndData: ethers.utils.arrayify("0x"),
    signature: ethers.utils.arrayify("0x"),
  };

  // check that the sender's account exists
  const exists = false; //  nonce.mask(64); // "/accounts/{acc_addr}/exists"

  // initCode
  if (!exists) {
    const accountCreationCode = accountFactoryInterface.encodeFunctionData(
      "createAccount",
      [signerAddress, ethers.BigNumber.from(0)]
    );

    userop.initCode = ethers.utils.hexConcat([
      accountFactoryAddress,
      accountCreationCode,
    ]);
  }

  // callData
  userop.callData = callData;

  return userop;
};

export const prepareUserOp = async (
  provider,
  owner,
  sender,
  callData,
  { erc4337, token }
) => {
  if (erc4337 === undefined || token === undefined) {
    throw new Error("Invalid config object");
  }

  const accountFactoryAddress = erc4337.account_factory_address;

  // generate a userop
  const userop = generateUserOp(owner, sender, accountFactoryAddress, callData);

  return userop;
};

export const paymasterSignUserOp = async (erc4337, userop) => {
  console.log("URL:", `${erc4337.rpc_url}/${erc4337.paymaster_address}`);
  const body = {
    method: "pm_sponsorUserOperation",
    params: [
      userop,
      erc4337.entrypoint_address,
      { type: erc4337.paymaster_type },
    ],
  };

  const resp = await fetch(`${erc4337.rpc_url}/${erc4337.paymaster_address}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  console.log(resp.status, resp.statusText);
  const response = await resp.json();

  console.log(response);

  return userop;
};

export const submitUserOp = async (rpcUrl, userop) => {
  return userop;
};

export const signUserOp = async (userop, tokenEntryPointContract, signer) => {
  const userOpHash = ethers.utils.arrayify(
    await tokenEntryPointContract.getUserOpHash(userop)
  );

  return await signer.signMessage(userOpHash);
};
