import React, { createContext, useContext, useEffect, ReactNode } from "react";
import { useNetwork } from "wagmi";
import { useQuery } from "@tanstack/react-query";
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

// Filter unique feeds by proxyAddress, preferring feeds with proxyAddress over those without
const filterUniqueFeeds = (feeds: ChainlinkFeed[]): ChainlinkFeed[] => {
  const seenProxyAddresses = new Set<string>();
  const uniqueFeeds: ChainlinkFeed[] = [];

  for (const feed of feeds) {
    const proxyAddress = feed.proxyAddress || feed.contractAddress;

    if (!seenProxyAddresses.has(proxyAddress)) {
      seenProxyAddresses.add(proxyAddress);
      uniqueFeeds.push(feed);
    }
  }

  return uniqueFeeds;
};

interface ChainlinkFeedsContextType {
  feeds: ChainlinkFeed[];
  popularFeeds: ChainlinkFeed[];
  isLoading: boolean;
  error: Error | null;
  currentNetwork: string;
}

const ChainlinkFeedsContext = createContext<
  ChainlinkFeedsContextType | undefined
>(undefined);

interface ChainlinkFeedsProviderProps {
  children: ReactNode;
}

export const ChainlinkFeedsProvider: React.FC<ChainlinkFeedsProviderProps> = ({
  children,
}) => {
  const { chain } = useNetwork();
  const currentNetwork = getNetworkFromChainId(chain?.id);

  console.log(
    `🌐 ChainlinkFeedsProvider: Current network: ${currentNetwork} (chainId: ${chain?.id})`
  );

  // Use TanStack Query to fetch and cache feeds automatically
  const feedsQuery = useQuery({
    queryKey: ["chainlink-feeds", currentNetwork],
    queryFn: async () => {
      console.log(`🔄 Fetching Chainlink feeds for network: ${currentNetwork}`);

      const response = await fetch(
        `/api/chainlink-feeds?network=${currentNetwork}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch feeds: ${response.statusText}`);
      }

      const data: ChainlinkFeedsResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch feeds");
      }

      console.log(
        `✅ Loaded ${data.data!.feeds.length} feeds and ${
          data.data!.popularFeeds.length
        } popular feeds`
      );

      return data.data!;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - datos frescos por 30 min
    gcTime: 60 * 60 * 1000, // 1 hour - mantener en cache por 1 hora
    refetchInterval: 30 * 60 * 1000, // Re-fetch every 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Fetch on mount para asegurar datos frescos
    refetchOnReconnect: true, // Re-fetch cuando se reconecte la red
    retry: 2,
    enabled: !!currentNetwork, // Only fetch if we have a valid network
  });

  // Log when data changes
  useEffect(() => {
    if (feedsQuery.data) {
      console.log(
        `📊 ChainlinkFeedsProvider: Cache updated for ${currentNetwork}`
      );
      console.log(`   - Total feeds: ${feedsQuery.data.feeds.length}`);
      console.log(`   - Popular feeds: ${feedsQuery.data.popularFeeds.length}`);
    }
  }, [feedsQuery.data, currentNetwork]);

  // Log errors
  useEffect(() => {
    if (feedsQuery.error) {
      console.error(
        `❌ ChainlinkFeedsProvider error for ${currentNetwork}:`,
        feedsQuery.error
      );
    }
  }, [feedsQuery.error, currentNetwork]);

  const contextValue: ChainlinkFeedsContextType = {
    feeds: filterUniqueFeeds(feedsQuery.data?.feeds || []),
    popularFeeds: filterUniqueFeeds(feedsQuery.data?.popularFeeds || []),
    isLoading: feedsQuery.isLoading,
    error: feedsQuery.error,
    currentNetwork,
  };

  return (
    <ChainlinkFeedsContext.Provider value={contextValue}>
      {children}
    </ChainlinkFeedsContext.Provider>
  );
};

// Hook para usar el contexto
export const useChainlinkFeedsContext = (): ChainlinkFeedsContextType => {
  const context = useContext(ChainlinkFeedsContext);
  if (context === undefined) {
    throw new Error(
      "useChainlinkFeedsContext must be used within a ChainlinkFeedsProvider"
    );
  }
  return context;
};

// Hooks específicos para feeds populares y todos los feeds
export const usePopularFeedsFromContext = () => {
  const { popularFeeds, isLoading, error } = useChainlinkFeedsContext();
  return {
    feeds: popularFeeds,
    isLoading,
    error,
  };
};

export const useAllFeedsFromContext = () => {
  const { feeds, isLoading, error } = useChainlinkFeedsContext();
  return {
    feeds,
    isLoading,
    error,
  };
};
