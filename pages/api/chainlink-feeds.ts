import type { NextApiRequest, NextApiResponse } from "next";
import {
  fetchChainlinkFeeds,
  getPopularFeeds,
  type NetworkId,
  type ChainlinkFeed,
} from "../../utils/chainlinkFeeds";

export interface ChainlinkFeedsResponse {
  success: boolean;
  data?: {
    feeds: ChainlinkFeed[];
    popularFeeds: ChainlinkFeed[];
    network: string;
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChainlinkFeedsResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method Not Allowed",
    });
  }

  const { network } = req.query;

  // Validate network parameter
  const networkId = (network as string)?.toUpperCase() as NetworkId;
  if (!networkId || !["ETHEREUM", "SEPOLIA"].includes(networkId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid network. Must be either "ethereum" or "sepolia"',
    });
  }

  try {
    console.log(`📡 Fetching feeds for network: ${networkId}`);
    const allFeeds = await fetchChainlinkFeeds(networkId);
    console.log(`📊 Raw feeds count: ${allFeeds.length}`);

    const popularFeeds = getPopularFeeds(allFeeds);
    console.log(`⭐ Popular feeds count: ${popularFeeds.length}`);

    return res.status(200).json({
      success: true,
      data: {
        feeds: allFeeds,
        popularFeeds,
        network: networkId,
      },
    });
  } catch (error) {
    console.error("Error fetching Chainlink feeds:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch Chainlink price feeds",
    });
  }
}
