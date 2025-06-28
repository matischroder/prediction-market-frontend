// Chainlink Price Feeds Integration
import { overrideFeedAddress } from "./sepoliaFeedsOverride";

export interface ChainlinkFeed {
  compareOffchain: string;
  contractAddress: string;
  contractType: string;
  contractVersion: number;
  decimalPlaces: number | null;
  ens: string | null;
  formatDecimalPlaces: number | null;
  healthPrice: string;
  heartbeat?: number;
  history: any;
  multiply: string;
  name: string;
  pair: string[];
  path: string;
  proxyAddress: string | null;
  threshold: number;
  valuePrefix: string;
  valueSuffix?: string;
  assetName: string;
  feedCategory: string;
  feedType: string;
  docs: {
    assetClass: string;
    assetSubClass?: string;
    assetName?: string;
    baseAsset: string;
    baseAssetClic?: string;
    clicProductName?: string;
    deliveryChannelCode: string;
    feedCategory: string;
    feedType: string;
    hidden?: boolean;
    marketHours: string;
    productSubType: string;
    productType: string;
    productTypeCode: string;
    quoteAsset?: string;
    quoteAssetClic?: string;
    blockchainName?: string;
    issuer?: string;
    porAuditor?: string;
    porSource?: string;
    porType?: string;
    reserveAsset?: string;
    reserveAssetClic?: string;
    underlyingAsset?: string;
    underlyingAssetClic?: string;
  };
  decimals: number;
  feedId?: string;
  sourceChain?: number;
  status?: string;
  oracles?: Array<{
    operator: string;
  }>;
}

export const SUPPORTED_NETWORKS = {
  ETHEREUM: {
    id: 1,
    name: "Ethereum Mainnet",
    rpcUrl:
      "https://eth-mainnet.alchemyapi.io/v2/" +
      process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
    feedsUrl: "https://reference-data-directory.vercel.app/feeds-mainnet.json",
  },
  SEPOLIA: {
    id: 11155111,
    name: "Sepolia Testnet",
    rpcUrl:
      "https://eth-sepolia.g.alchemy.com/v2/" +
      process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
    feedsUrl:
      "https://reference-data-directory.vercel.app/feeds-ethereum-testnet-sepolia.json",
  },
} as const;

export type NetworkId = keyof typeof SUPPORTED_NETWORKS;

// Filter for safe price feeds suitable for prediction markets
export const isSuitableFeed = (feed: ChainlinkFeed): boolean => {
  // Debug log to see what's being filtered out
  const reasons: string[] = [];

  // Only exclude feeds with explicitly bad categories
  if (feed.feedCategory === "deprecated" || feed.feedCategory === "test") {
    reasons.push(`feedCategory: ${feed.feedCategory}`);
  }

  // Exclude explicitly hidden feeds (but allow testing feeds for testnet)
  if (feed.docs?.hidden && feed.feedCategory !== "") {
    reasons.push("hidden");
  }

  // Allow most feed types, only exclude very specific ones
  if (feed.feedType && ["Deprecated", "Test"].includes(feed.feedType)) {
    reasons.push(`feedType: ${feed.feedType}`);
  }

  // Must have valid contract address
  if (
    !feed.contractAddress ||
    feed.contractAddress === "0x0000000000000000000000000000000000000000"
  ) {
    reasons.push("invalid contract address");
  }

  // Must have some kind of name or pair information
  if (!feed.name && (!feed.pair || feed.pair.length === 0)) {
    reasons.push("no name or pair");
  }

  // Log the first few that are filtered out for debugging
  if (reasons.length > 0) {
    if (Math.random() < 0.1) {
      // Log 10% of filtered feeds for debugging
      console.log(`❌ Filtered out "${feed.name}": ${reasons.join(", ")}`);
    }
    return false;
  }

  // Log accepted feeds
  if (Math.random() < 0.3) {
    // Log 30% of accepted feeds
    console.log(
      `✅ Accepted "${feed.name}" - ${feed.pair?.[0]}/${feed.pair?.[1]} (${feed.feedType})`
    );
  }

  return true;
};

// Fetch price feeds from Chainlink APIs
export const fetchChainlinkFeeds = async (
  networkId: NetworkId
): Promise<ChainlinkFeed[]> => {
  const network = SUPPORTED_NETWORKS[networkId];
  console.log(`🔗 Fetching from: ${network.feedsUrl}`);

  try {
    const response = await fetch(network.feedsUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch feeds: ${response.statusText}`);
    }

    const allFeeds: ChainlinkFeed[] = await response.json();
    console.log(`📦 Total feeds from API: ${allFeeds.length}`);

    const suitableFeeds = allFeeds.filter(isSuitableFeed);
    console.log(`✅ Suitable feeds after filtering: ${suitableFeeds.length}`);

    // Apply address overrides for known working feeds
    const feedsWithOverrides = suitableFeeds.map((feed) =>
      overrideFeedAddress(feed, networkId)
    );
    console.log(`🔧 Applied feed address overrides for ${networkId}`);

    return feedsWithOverrides;
  } catch (error) {
    console.error(`Error fetching Chainlink feeds for ${network.name}:`, error);
    return [];
  }
};

// Popular feeds for quick selection
export const getPopularFeeds = (feeds: ChainlinkFeed[]): ChainlinkFeed[] => {
  const popularPairs = [
    "BTC/USD",
    "ETH/USD",
    "BNB/USD",
    "SOL/USD",
    "ADA/USD",
    "DOT/USD",
    "AVAX/USD",
    "MATIC/USD",
    "LINK/USD",
    "UNI/USD",
    "EUR/USD",
    "GBP/USD",
    "JPY/USD",
    "CHF/USD",
    "AUD/USD",
  ];

  return feeds
    .filter((feed) => {
      const pairString = `${feed.pair[0]}/${feed.pair[1]}`;
      return popularPairs.includes(pairString);
    })
    .sort((a, b) => {
      const aIndex = popularPairs.indexOf(`${a.pair[0]}/${a.pair[1]}`);
      const bIndex = popularPairs.indexOf(`${b.pair[0]}/${b.pair[1]}`);
      return aIndex - bIndex;
    });
};

// Format feed name for display
export const formatFeedName = (feed: ChainlinkFeed): string => {
  if (feed.pair && feed.pair[0] && feed.pair[1]) {
    return `${feed.pair[0]}/${feed.pair[1]}`;
  }
  return feed.name;
};

// Get feed description
export const getFeedDescription = (feed: ChainlinkFeed): string => {
  const baseDescription = `${formatFeedName(feed)} price feed`;

  if (feed.heartbeat) {
    const hours = Math.floor(feed.heartbeat / 3600);
    return `${baseDescription} (updates every ${hours}h)`;
  }

  return baseDescription;
};
