import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
} from "react";
import { useMarketContract } from "../hooks/useMarketContract";
import { Market, MarketOdds, UserBets } from "../types/contracts";
import { ethers } from "ethers";

interface MarketContextType {
  markets: Market[];
  loading: boolean;
  error: Error | null;
  createMarket: (marketParams: {
    assetName: string;
    baseAsset: string;
    targetPrice: ethers.BigNumber;
    resolutionTime: number;
    priceFeed: string;
  }) => Promise<string | null>;
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
  console.log(
    "MarketProvider initialized with factory address:",
    factoryAddress
  );
  const { markets, loading, createMarket, fetchMarkets } =
    useMarketContract(factoryAddress);

  const refetchMarkets = () => {
    fetchMarkets();
  };

  const contextValue: MarketContextType = {
    markets,
    loading,
    error: null, // useMarketContract doesn't expose error directly
    createMarket,
    refetchMarkets,
  };

  return (
    <MarketContext.Provider value={contextValue}>
      {children}
    </MarketContext.Provider>
  );
}

export const useMarkets = (): MarketContextType => {
  const context = useContext(MarketContext);
  if (context === undefined) {
    throw new Error("useMarkets must be used within a MarketProvider");
  }
  return context;
};

// Additional hooks for market-specific data
export const useMarketData = (marketAddress: string) => {
  const { getMarketOdds, getUserBets } = useMarketContract(
    process.env.NEXT_PUBLIC_MARKET_FACTORY_ADDRESS || ""
  );

  const [odds, setOdds] = useState<MarketOdds | null>(null);
  const [userBets, setUserBets] = useState<UserBets>({
    higherBet: "0",
    lowerBet: "0",
    hasClaimed: false,
    betIndices: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!marketAddress) return;

      setIsLoading(true);
      try {
        const [oddsResult, betsResult] = await Promise.all([
          getMarketOdds(marketAddress),
          getUserBets(marketAddress),
        ]);

        if (oddsResult) setOdds(oddsResult);
        if (betsResult) {
          setUserBets({
            higherBet: betsResult.higherBet || "0",
            lowerBet: betsResult.lowerBet || "0",
            hasClaimed: betsResult.hasClaimed || false,
            betIndices: betsResult.betIndices || [],
          });
        }
      } catch (error) {
        console.error("Error fetching market data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [marketAddress, getMarketOdds, getUserBets]);

  return { odds, userBets, isLoading };
};
