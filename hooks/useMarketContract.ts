import { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import { usePublicClient, useWalletClient, useAccount } from "wagmi";
import { Market, MarketOdds } from "@/types/contracts";

const MARKET_FACTORY_ABI = [
  "function getAllMarkets() view returns (address[])",
  "function getMarketsCount() view returns (uint256)",
  "function createMarket(string memory question, uint256 resolutionTime) returns (address)",
];

const PREDICTION_MARKET_ABI = [
  "function getMarketInfo() view returns (string memory question, uint256 resolutionTime, uint256 totalYesBets, uint256 totalNoBets, bool isResolved, bool outcome)",
  "function getCurrentOdds() view returns (uint256 yesOdds, uint256 noOdds)",
  "function placeBet(bool position, uint256 amount)",
  "function claimPrize()",
  "function yesBets(address) view returns (uint256)",
  "function noBets(address) view returns (uint256)",
  "function hasClaimed(address) view returns (bool)",
];

export function useMarketContract(factoryAddress: string) {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState(0);
  const fetchingRef = useRef(false);
  const mountedRef = useRef(true);

  // Create ethers.js providers from wagmi clients
  const provider = publicClient
    ? new ethers.providers.Web3Provider(publicClient as any)
    : undefined;
  const signer = walletClient
    ? new ethers.providers.Web3Provider(walletClient as any).getSigner()
    : undefined;

  const factoryContract = provider
    ? new ethers.Contract(
        factoryAddress,
        MARKET_FACTORY_ABI,
        signer || provider
      )
    : undefined;

  const fetchMarkets = useCallback(async () => {
    if (!provider || !factoryContract || !factoryAddress) return;

    // Prevenir múltiples llamadas simultáneas
    if (fetchingRef.current) {
      console.log("Fetch already in progress, skipping");
      return;
    }

    // Debounce: solo fetch si han pasado al menos 10 segundos desde la última llamada
    const now = Date.now();
    if (now - lastFetch < 10000) {
      console.log("Skipping fetch - too recent");
      return;
    }

    fetchingRef.current = true;
    setLoading(true);
    setLastFetch(now);

    try {
      console.log("Fetching markets from factory:", factoryAddress);

      // Primero verificar si hay mercados
      const marketCount = await factoryContract.getMarketsCount();
      console.log("Market count:", marketCount.toNumber());

      if (marketCount.toNumber() === 0) {
        setMarkets([]);
        return;
      }

      const marketAddresses = await factoryContract.getAllMarkets();
      console.log("Market addresses:", marketAddresses);

      // Limitar el número de mercados para evitar demasiadas llamadas
      const limitedAddresses = marketAddresses.slice(0, 5);

      const marketPromises = limitedAddresses.map(
        async (marketAddress: string, index: number) => {
          try {
            // Agregar delay entre requests para evitar rate limiting
            await new Promise((resolve) => setTimeout(resolve, index * 100));

            const marketContract = new ethers.Contract(
              marketAddress,
              PREDICTION_MARKET_ABI,
              provider
            );

            const marketInfo = await marketContract.getMarketInfo();

            return {
              address: marketAddress,
              question: marketInfo.question,
              resolutionTime: marketInfo.resolutionTime.toNumber(),
              totalYesBets: marketInfo.totalYesBets.toString(),
              totalNoBets: marketInfo.totalNoBets.toString(),
              isResolved: marketInfo.isResolved,
              outcome: marketInfo.outcome,
              creator: "", // Would need to track this separately
            } as Market;
          } catch (error) {
            console.error(`Error fetching market ${marketAddress}:`, error);
            return null;
          }
        }
      );

      const marketData = (await Promise.all(marketPromises)).filter(
        Boolean
      ) as Market[];

      if (mountedRef.current) {
        setMarkets(marketData);
        console.log("Markets updated:", marketData.length);
      }
    } catch (error) {
      console.error("Error fetching markets:", error);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      fetchingRef.current = false;
    }
  }, [factoryContract, provider, factoryAddress, lastFetch]);

  const createMarket = useCallback(
    async (
      question: string,
      resolutionTime: number
    ): Promise<string | null> => {
      if (!signer || !factoryContract) {
        console.error("No signer or factory contract available");
        return null;
      }

      try {
        console.log("Creating market with:", { question, resolutionTime });
        const tx = await factoryContract
          .connect(signer)
          .createMarket(question, resolutionTime);
        console.log("Transaction sent:", tx.hash);

        const receipt = await tx.wait();
        console.log("Transaction confirmed:", receipt.transactionHash);

        // Esperar un poco antes de refrescar para evitar rate limiting
        setTimeout(() => {
          fetchMarkets();
        }, 2000);

        return receipt.transactionHash;
      } catch (error) {
        console.error("Error creating market:", error);
        return null;
      }
    },
    [factoryContract, signer, fetchMarkets]
  );

  const placeBet = useCallback(
    async (
      marketAddress: string,
      position: boolean,
      amount: ethers.BigNumber
    ): Promise<boolean> => {
      if (!signer) return false;

      try {
        const marketContract = new ethers.Contract(
          marketAddress,
          PREDICTION_MARKET_ABI,
          signer
        );

        const tx = await marketContract.placeBet(position, amount);
        await tx.wait();

        // Refresh markets after bet
        await fetchMarkets();

        return true;
      } catch (error) {
        console.error("Error placing bet:", error);
        return false;
      }
    },
    [signer, fetchMarkets]
  );

  const claimPrize = useCallback(
    async (marketAddress: string): Promise<boolean> => {
      if (!signer) return false;

      try {
        const marketContract = new ethers.Contract(
          marketAddress,
          PREDICTION_MARKET_ABI,
          signer
        );

        const tx = await marketContract.claimPrize();
        await tx.wait();

        return true;
      } catch (error) {
        console.error("Error claiming prize:", error);
        return false;
      }
    },
    [signer]
  );

  const getMarketOdds = useCallback(
    async (marketAddress: string): Promise<MarketOdds | null> => {
      if (!provider) return null;

      try {
        // Agregar delay para evitar rate limiting
        await new Promise((resolve) => setTimeout(resolve, 50));

        const marketContract = new ethers.Contract(
          marketAddress,
          PREDICTION_MARKET_ABI,
          provider
        );

        const odds = await marketContract.getCurrentOdds();

        return {
          yesOdds: odds.yesOdds.toNumber(),
          noOdds: odds.noOdds.toNumber(),
        };
      } catch (error) {
        console.error("Error getting odds:", error);
        return null;
      }
    },
    [provider]
  );

  const getUserBets = useCallback(
    async (marketAddress: string) => {
      if (!provider || !address)
        return { yesBet: "0", noBet: "0", hasClaimed: false };

      try {
        // Agregar delay para evitar rate limiting
        await new Promise((resolve) => setTimeout(resolve, 50));

        const marketContract = new ethers.Contract(
          marketAddress,
          PREDICTION_MARKET_ABI,
          provider
        );

        const yesBet = await marketContract.yesBets(address);
        const noBet = await marketContract.noBets(address);
        const hasClaimed = await marketContract.hasClaimed(address);

        return {
          yesBet: yesBet.toString(),
          noBet: noBet.toString(),
          hasClaimed,
        };
      } catch (error) {
        console.error("Error getting user bets:", error);
        return { yesBet: "0", noBet: "0", hasClaimed: false };
      }
    },
    [provider, address]
  );

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Solo fetch cuando tenemos todos los requisitos y no hay mercados cargados
    if (
      provider &&
      factoryContract &&
      factoryAddress &&
      markets.length === 0 &&
      !fetchingRef.current
    ) {
      console.log("Initial fetch triggered");
      fetchMarkets();
    }
  }, [provider, factoryContract, factoryAddress, markets.length, fetchMarkets]);

  return {
    markets,
    loading,
    fetchMarkets,
    createMarket,
    placeBet,
    claimPrize,
    getMarketOdds,
    getUserBets,
  };
}
