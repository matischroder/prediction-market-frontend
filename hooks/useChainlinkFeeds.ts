import { useQuery } from "@tanstack/react-query";
import { useNetwork } from "wagmi";
import { ChainlinkFeed } from "../utils/chainlinkFeeds";
import { ChainlinkFeedsResponse } from "../pages/api/chainlink-feeds";

// Map chain IDs to network names
const getNetworkFromChainId = (chainId?: number): string => {
  switch (chainId) {
    case 1:
      return "ethereum";
    case 11155111:
      return "sepolia";
    default:
      return "sepolia"; // Default fallback
  }
};

export const useChainlinkFeeds = () => {
  const { chain } = useNetwork();
  const networkName = getNetworkFromChainId(chain?.id);

  return useQuery({
    queryKey: ["chainlink-feeds", networkName],
    queryFn: async () => {
      const response = await fetch(
        `/api/chainlink-feeds?network=${networkName}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch feeds: ${response.statusText}`);
      }

      const data: ChainlinkFeedsResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch feeds");
      }

      return data.data!;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 2,
  });
};

export const usePopularFeeds = () => {
  const feedsQuery = useChainlinkFeeds();

  return {
    feeds: feedsQuery.data?.popularFeeds || [],
    isLoading: feedsQuery.isLoading,
    error: feedsQuery.error,
  };
};

export const useAllFeeds = () => {
  const feedsQuery = useChainlinkFeeds();

  return {
    feeds: feedsQuery.data?.feeds || [],
    isLoading: feedsQuery.isLoading,
    error: feedsQuery.error,
  };
};
