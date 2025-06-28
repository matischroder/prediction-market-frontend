import { ChainlinkFeed, NetworkId } from "./chainlinkFeeds";

// Override for Sepolia price feeds - use our known working addresses
export const SEPOLIA_PRICE_FEEDS_OVERRIDE = {
  "BTC/USD": "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43",
  "ETH/USD": "0x694AA1769357215DE4FAC081bf1f309aDC325306",
  "LINK/USD": "0xc59E3633BAAC79493d908e63626716e204A45EdF",
};

// Override function to fix contract addresses for known feeds
export const overrideFeedAddress = (
  feed: ChainlinkFeed,
  networkId: NetworkId
): ChainlinkFeed => {
  if (networkId !== "SEPOLIA") return feed;

  const pairKey = feed.pair.join("/");
  const overrideAddress =
    SEPOLIA_PRICE_FEEDS_OVERRIDE[
      pairKey as keyof typeof SEPOLIA_PRICE_FEEDS_OVERRIDE
    ];

  if (overrideAddress) {
    console.log(
      `🔧 Overriding ${pairKey}: ${feed.contractAddress} → ${overrideAddress}`
    );
    return {
      ...feed,
      contractAddress: overrideAddress,
      proxyAddress: overrideAddress,
    };
  }

  return feed;
};
