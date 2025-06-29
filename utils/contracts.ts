import addresses from "../contracts/addresses.json";

export function getContractAddress(
  contractName: keyof typeof addresses.contracts
): `0x${string}` {
  const address = addresses.contracts[contractName];
  if (!address || address === "Not created - needs LINK funding") {
    throw new Error(`Contract ${contractName} not deployed`);
  }
  return address as `0x${string}`;
}

export function getChainlinkAddress(
  name: keyof typeof addresses.chainlink
): `0x${string}` {
  return addresses.chainlink[name] as `0x${string}`;
}

export function getPriceFeedAddress(
  pairName: keyof typeof addresses.priceFeeds
): `0x${string}` {
  return addresses.priceFeeds[pairName] as `0x${string}`;
}
