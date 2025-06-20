import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

// Hook para obtener todos los mercados
export function useMarkets(factoryAddress: string) {
  const publicClient = usePublicClient();
  const provider = publicClient
    ? new ethers.providers.Web3Provider(publicClient as any)
    : undefined;

  return useQuery({
    queryKey: ["markets", factoryAddress],
    queryFn: async (): Promise<Market[]> => {
      if (!provider || !factoryAddress) {
        throw new Error("Provider or factory address not available");
      }

      const factoryContract = new ethers.Contract(
        factoryAddress,
        MARKET_FACTORY_ABI,
        provider
      );

      console.log("Fetching markets from factory:", factoryAddress);

      // Primero verificar si hay mercados
      const marketCount = await factoryContract.getMarketsCount();
      console.log("Market count:", marketCount.toNumber());

      if (marketCount.toNumber() === 0) {
        return [];
      }

      const marketAddresses = await factoryContract.getAllMarkets();
      console.log("Market addresses:", marketAddresses);

      // Limitar y procesar los mercados con delay
      const limitedAddresses = marketAddresses.slice(0, 5);

      const marketPromises = limitedAddresses.map(
        async (marketAddress: string, index: number) => {
          try {
            // Agregar delay progresivo para evitar rate limiting
            await new Promise(resolve => setTimeout(resolve, index * 200));

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
              creator: "",
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

      console.log("Markets fetched:", marketData.length);
      return marketData;
    },
    enabled: !!provider && !!factoryAddress,
    staleTime: 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
  });
}

// Hook para obtener odds de un mercado específico
export function useMarketOdds(marketAddress: string) {
  const publicClient = usePublicClient();
  const provider = publicClient
    ? new ethers.providers.Web3Provider(publicClient as any)
    : undefined;

  return useQuery({
    queryKey: ["marketOdds", marketAddress],
    queryFn: async (): Promise<MarketOdds> => {
      if (!provider || !marketAddress) {
        throw new Error("Provider or market address not available");
      }

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
    },
    enabled: !!provider && !!marketAddress,
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 2 * 60 * 1000, // 2 minutos
  });
}

// Hook para obtener las apuestas del usuario
export function useUserBets(marketAddress: string) {
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const provider = publicClient
    ? new ethers.providers.Web3Provider(publicClient as any)
    : undefined;

  return useQuery({
    queryKey: ["userBets", marketAddress, address],
    queryFn: async () => {
      if (!provider || !address || !marketAddress) {
        return { yesBet: "0", noBet: "0", hasClaimed: false };
      }

      const marketContract = new ethers.Contract(
        marketAddress,
        PREDICTION_MARKET_ABI,
        provider
      );

      const [yesBet, noBet, hasClaimed] = await Promise.all([
        marketContract.yesBets(address),
        marketContract.noBets(address),
        marketContract.hasClaimed(address),
      ]);

      return {
        yesBet: yesBet.toString(),
        noBet: noBet.toString(),
        hasClaimed,
      };
    },
    enabled: !!provider && !!address && !!marketAddress,
    staleTime: 20 * 1000, // 20 segundos
    gcTime: 60 * 1000, // 1 minuto
  });
}

// Hook para crear mercado
export function useCreateMarket(factoryAddress: string) {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();

  const provider = publicClient
    ? new ethers.providers.Web3Provider(publicClient as any)
    : undefined;
  const signer = walletClient
    ? new ethers.providers.Web3Provider(walletClient as any).getSigner()
    : undefined;

  return useMutation({
    mutationFn: async ({
      question,
      resolutionTime,
    }: {
      question: string;
      resolutionTime: number;
    }): Promise<string> => {
      if (!signer || !provider || !factoryAddress) {
        throw new Error("Signer, provider or factory address not available");
      }

      const factoryContract = new ethers.Contract(
        factoryAddress,
        MARKET_FACTORY_ABI,
        signer
      );

      console.log("Creating market with:", { question, resolutionTime });
      const tx = await factoryContract.createMarket(question, resolutionTime);
      console.log("Transaction sent:", tx.hash);

      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt.transactionHash);

      return receipt.transactionHash;
    },
    onSuccess: () => {
      // Invalidar la cache de mercados para refrescar la lista
      queryClient.invalidateQueries({ queryKey: ["markets", factoryAddress] });
    },
  });
}

// Hook para hacer apuesta
export function usePlaceBet() {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();

  const provider = publicClient
    ? new ethers.providers.Web3Provider(publicClient as any)
    : undefined;
  const signer = walletClient
    ? new ethers.providers.Web3Provider(walletClient as any).getSigner()
    : undefined;

  return useMutation({
    mutationFn: async ({
      marketAddress,
      position,
      amount,
    }: {
      marketAddress: string;
      position: boolean;
      amount: ethers.BigNumber;
    }): Promise<void> => {
      if (!signer || !provider) {
        throw new Error("Signer or provider not available");
      }

      const marketContract = new ethers.Contract(
        marketAddress,
        PREDICTION_MARKET_ABI,
        signer
      );

      const tx = await marketContract.placeBet(position, amount);
      await tx.wait();
    },
    onSuccess: (_, { marketAddress }) => {
      // Invalidar caches relacionadas
      queryClient.invalidateQueries({ queryKey: ["markets"] });
      queryClient.invalidateQueries({ queryKey: ["marketOdds", marketAddress] });
      queryClient.invalidateQueries({ queryKey: ["userBets", marketAddress] });
    },
  });
}

// Hook para reclamar premio
export function useClaimPrize() {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();

  const provider = publicClient
    ? new ethers.providers.Web3Provider(publicClient as any)
    : undefined;
  const signer = walletClient
    ? new ethers.providers.Web3Provider(walletClient as any).getSigner()
    : undefined;

  return useMutation({
    mutationFn: async ({ marketAddress }: { marketAddress: string }): Promise<void> => {
      if (!signer || !provider) {
        throw new Error("Signer or provider not available");
      }

      const marketContract = new ethers.Contract(
        marketAddress,
        PREDICTION_MARKET_ABI,
        signer
      );

      const tx = await marketContract.claimPrize();
      await tx.wait();
    },
    onSuccess: (_, { marketAddress }) => {
      // Invalidar cache de user bets
      queryClient.invalidateQueries({ queryKey: ["userBets", marketAddress] });
    },
  });
}
