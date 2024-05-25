import { ethers } from "ethers";
import tokenEntryPointContractAbi from "smartcontracts/build/contracts/tokenEntryPoint/TokenEntryPoint.abi";
import accountFactoryContractAbi from "smartcontracts/build/contracts/accfactory/AccountFactory.abi";
import accountContractAbi from "smartcontracts/build/contracts/account/Account.abi";
import tokenContractAbi from "smartcontracts/build/contracts/erc20/ERC20.abi";

const accountFactoryInterface = new ethers.utils.Interface(
  accountFactoryContractAbi
);
const accountInterface = new ethers.utils.Interface(accountContractAbi);
const erc20Token = new ethers.utils.Interface(tokenContractAbi);

const adjustForDecimals = (amount, decimals) => {
  return BigInt(amount) * 10n ** BigInt(decimals);
};

const transferCallData = (tokenAddress, receiver, amount) =>
  accountInterface.encodeFunctionData("execute", [
    tokenAddress,
    ethers.constants.Zero,
    erc20Token.encodeFunctionData("transfer", [receiver, amount]),
  ]);

const userOpToJson = (userop) => {
  const newUserop = {
    sender: userop.sender,
    nonce: userop.nonce.toHexString().replace("0x0", "0x"),
    initCode: ethers.utils.hexlify(userop.initCode),
    callData: ethers.utils.hexlify(userop.callData),
    callGasLimit: userop.callGasLimit.toHexString().replace("0x0", "0x"),
    verificationGasLimit: userop.verificationGasLimit
      .toHexString()
      .replace("0x0", "0x"),
    preVerificationGas: userop.preVerificationGas
      .toHexString()
      .replace("0x0", "0x"),
    maxFeePerGas: userop.maxFeePerGas.toHexString().replace("0x0", "0x"),
    maxPriorityFeePerGas: userop.maxPriorityFeePerGas
      .toHexString()
      .replace("0x0", "0x"),
    paymasterAndData: ethers.utils.hexlify(userop.paymasterAndData),
    signature: ethers.utils.hexlify(userop.signature),
  };

  return newUserop;
};

const userOpFromJson = (userop) => {
  const newUserop = {
    sender: userop.sender,
    nonce: BigInt(userop.nonce),
    initCode: ethers.utils.arrayify(userop.initCode),
    callData: ethers.utils.arrayify(userop.callData),
    callGasLimit: BigInt(userop.callGasLimit),
    verificationGasLimit: BigInt(userop.verificationGasLimit),
    preVerificationGas: BigInt(userop.preVerificationGas),
    maxFeePerGas: BigInt(userop.maxFeePerGas),
    maxPriorityFeePerGas: BigInt(userop.maxPriorityFeePerGas),
    paymasterAndData: ethers.utils.arrayify(userop.paymasterAndData),
    signature: ethers.utils.arrayify(userop.signature),
  };

  return newUserop;
};

const senderAccountExists = async (indexer, sender) => {
  const url = `${indexer.url}/accounts/${sender}/exists`;

  const resp = await fetch(url);
  return resp.status === 200;
};

const generateUserOp = (
  signerAddress,
  sender,
  senderAccountExists = false,
  accountFactoryAddress,
  callData
) => {
  const userop = {
    sender,
    nonce: BigInt("0"),
    initCode: ethers.utils.arrayify("0x"),
    callData: ethers.utils.arrayify("0x"),
    callGasLimit: BigInt("0"),
    verificationGasLimit: BigInt("1500000"),
    preVerificationGas: BigInt("21000"),
    maxFeePerGas: BigInt("0"),
    maxPriorityFeePerGas: BigInt("1000000000"),
    paymasterAndData: ethers.utils.arrayify("0x"),
    signature: ethers.utils.arrayify("0x"),
  };

  // initCode
  if (!senderAccountExists) {
    const accountCreationCode = accountFactoryInterface.encodeFunctionData(
      "createAccount",
      [signerAddress, BigInt(0)]
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

const prepareUserOp = async (
  owner,
  sender,
  callData,
  { indexer, erc4337, token }
) => {
  if (erc4337 === undefined || token === undefined) {
    throw new Error("Invalid config object");
  }

  const accountFactoryAddress = erc4337.account_factory_address;

  // check that the sender's account exists
  const exists = await senderAccountExists(indexer, sender);

  // generate a userop
  const userop = generateUserOp(
    owner,
    sender,
    exists,
    accountFactoryAddress,
    callData
  );

  return userop;
};

const paymasterSignUserOp = async (erc4337, userop) => {
  const rpcUrl = `${erc4337.rpc_url}/${erc4337.paymaster_address}`;

  const body = {
    jsonrpc: "2.0",
    id: 1,
    method: "pm_ooSponsorUserOperation",
    params: [
      userOpToJson(userop),
      erc4337.entrypoint_address,
      { type: erc4337.paymaster_type },
      1,
    ],
  };

  const resp = await fetch(rpcUrl, {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (resp.status !== 200) {
    console.log("!!! error calling RPC", rpcUrl, resp.statusText);
    console.log(
      "Are you sure the indexer is running and the paymaster is deployed?"
    );
    throw new Error(resp.statusText);
  }

  const response = await resp.json();

  if (!response?.result?.length) {
    throw new Error("Invalid response");
  }

  return userOpFromJson(response.result[0]);
};

const submitUserOp = async (erc4337, userop) => {
  const rpcUrl = `${erc4337.rpc_url}/${erc4337.paymaster_address}`;

  const extraData = { description: "top up" };

  const body = {
    jsonrpc: "2.0",
    id: 1,
    method: "eth_sendUserOperation",
    params: [userOpToJson(userop), erc4337.entrypoint_address, extraData],
  };

  const resp = await fetch(rpcUrl, {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (resp.status !== 200) throw new Error(resp.statusText);

  return userop;
};

const signUserOp = async (userop, tokenEntryPointContract, signer) => {
  const userOpHash = ethers.utils.arrayify(
    await tokenEntryPointContract.getUserOpHash(userop)
  );

  return await signer.signMessage(userOpHash);
};

export const userOpERC20Transfer = async (
  config,
  provider,
  signer,
  to,
  amount
) => {
  const accountFactoryContract = new ethers.Contract(
    config.erc4337.account_factory_address,
    accountFactoryContractAbi,
    provider
  );

  const sender = await accountFactoryContract.getAddress(signer.address, 0);

  const erc20Contract = new ethers.Contract(
    config.token.address,
    tokenContractAbi,
    provider
  );

  const decimals = await erc20Contract.decimals();

  const callData = transferCallData(
    erc20Contract.address,
    to,
    adjustForDecimals(amount, decimals)
  );

  let userop = await prepareUserOp(signer.address, sender, callData, config);

  // get the paymaster to sign the userop
  userop = await paymasterSignUserOp(config.erc4337, userop);

  const tokenEntryPointContract = new ethers.Contract(
    config.erc4337.entrypoint_address,
    tokenEntryPointContractAbi,
    provider
  );

  // sign the userop
  const signature = await signUserOp(userop, tokenEntryPointContract, signer);

  userop.signature = signature;

  // submit the user op
  await submitUserOp(config.erc4337, userop);

  return userop.signature;
};
