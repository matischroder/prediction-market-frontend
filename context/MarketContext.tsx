import React, { createContext, useContext, ReactNode } from "react";
import {
  useMarkets as useMarketsQuery,
  useCreateMarket,
  useMarketOdds,
  useUserBets,
  usePlaceBet,
  useClaimPrize,
} from "../hooks/useMarketQueries";
import { Market } from "../types/contracts";

interface MarketContextType {
  markets: Market[];
  loading: boolean;
  error: Error | null;
  createMarket: (question: string, resolutionTime: number) => Promise<string>;
  refetchMarkets: () => void;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

interface MarketProviderProps {
  children: ReactNode;
  factoryAddress: string;
}

export function MarketProvider({
  children,
  factoryAddress,
}: MarketProviderProps) {
  const {
    data: markets = [],
    isLoading: loading,
    error,
    refetch: refetchMarkets,
  } = useMarketsQuery(factoryAddress);

  const createMarketMutation = useCreateMarket(factoryAddress);

  const createMarket = async (
    question: string,
    resolutionTime: number
  ): Promise<string> => {
    const result = await createMarketMutation.mutateAsync({
      question,
      resolutionTime,
    });
    // Invalidar las queries para refrescar los datos
    refetchMarkets();
    return result;
  };

  const contextValue: MarketContextType = {
    markets,
    loading: loading || createMarketMutation.isPending,
    error: error as Error | null,
    createMarket,
    refetchMarkets,
  };

  return (
    <MarketContext.Provider value={contextValue}>
      {children}
    </MarketContext.Provider>
  );
}

export function useMarkets() {
  const context = useContext(MarketContext);
  if (context === undefined) {
    throw new Error("useMarkets must be used within a MarketProvider");
  }
  return context;
}

// Hook para usar datos específicos de un mercado
export function useMarketData(marketAddress: string) {
  const oddsQuery = useMarketOdds(marketAddress);
  const userBetsQuery = useUserBets(marketAddress);
  const placeBetMutation = usePlaceBet();
  const claimPrizeMutation = useClaimPrize();

  return {
    odds: oddsQuery.data || { yesOdds: 5000, noOdds: 5000 },
    userBets: userBetsQuery.data || {
      yesBet: "0",
      noBet: "0",
      hasClaimed: false,
    },
    isLoading: oddsQuery.isLoading || userBetsQuery.isLoading,
    placeBet: placeBetMutation.mutate,
    claimPrize: claimPrizeMutation.mutate,
    isPlacingBet: placeBetMutation.isPending,
    isClaimingPrize: claimPrizeMutation.isPending,
  };
}
