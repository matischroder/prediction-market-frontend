import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMarketContract } from "./useMarketContract";
import { useMarketData } from "@/context/MarketContext";

export const useMarketOdds = (marketAddress: string) => {
  const { getMarketOdds } = useMarketContract(
    process.env.NEXT_PUBLIC_MARKET_FACTORY_ADDRESS || ""
  );

  return useQuery({
    queryKey: ["market-odds", marketAddress],
    queryFn: () => getMarketOdds(marketAddress),
    enabled: !!marketAddress,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useUserBets = (marketAddress: string) => {
  const { getUserBets } = useMarketContract(
    process.env.NEXT_PUBLIC_MARKET_FACTORY_ADDRESS || ""
  );

  return useQuery({
    queryKey: ["user-bets", marketAddress],
    queryFn: () => getUserBets(marketAddress),
    enabled: !!marketAddress,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useClaimPayout = () => {
  const queryClient = useQueryClient();
  const { claimPayout } = useMarketContract(
    process.env.NEXT_PUBLIC_MARKET_FACTORY_ADDRESS || ""
  );

  return useMutation({
    mutationFn: ({
      marketAddress,
      betIndex,
    }: {
      marketAddress: string;
      betIndex: number;
    }) => claimPayout(marketAddress, betIndex),
    onSuccess: (_, variables) => {
      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({
        queryKey: ["user-bets", variables.marketAddress],
      });
      queryClient.invalidateQueries({
        queryKey: ["market-odds", variables.marketAddress],
      });
    },
  });
};

export const useClaimBonusReward = () => {
  const queryClient = useQueryClient();
  const { claimBonusReward } = useMarketContract(
    process.env.NEXT_PUBLIC_MARKET_FACTORY_ADDRESS || ""
  );

  return useMutation({
    mutationFn: ({ marketAddress }: { marketAddress: string }) =>
      claimBonusReward(marketAddress),
    onSuccess: (_, variables) => {
      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({
        queryKey: ["user-bets", variables.marketAddress],
      });
      queryClient.invalidateQueries({
        queryKey: ["market-odds", variables.marketAddress],
      });
    },
  });
};

// Legacy support - maps to claimPayout with betIndex 0
export const useClaimPrize = () => {
  const queryClient = useQueryClient();
  const { claimPayout } = useMarketContract(
    process.env.NEXT_PUBLIC_MARKET_FACTORY_ADDRESS || ""
  );

  return useMutation({
    mutationFn: ({
      marketAddress,
      betIndex = 0,
    }: {
      marketAddress: string;
      betIndex?: number;
    }) => claimPayout(marketAddress, betIndex),
    onSuccess: (_, variables) => {
      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({
        queryKey: ["user-bets", variables.marketAddress],
      });
      queryClient.invalidateQueries({
        queryKey: ["market-odds", variables.marketAddress],
      });
    },
  });
};
