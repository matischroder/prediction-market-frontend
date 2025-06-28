import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { usePublicClient, useWalletClient, useAccount } from "wagmi";
import { Market, MarketOdds } from "@/types/contracts";
import MarketFactoryABI from "@/contracts/abis/MarketFactory.json";
import PredictionMarketABI from "@/contracts/abis/PredictionMarket.json";

export function useMarketContract(factoryAddress: string) {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // Solo crear provider cuando tengamos wallet conectado
  const provider =
    typeof window !== "undefined" && (window as any).ethereum
      ? new ethers.providers.Web3Provider((window as any).ethereum)
      : undefined;
  const signer = provider && address ? provider.getSigner() : undefined;

  const factoryContract =
    provider && factoryAddress
      ? new ethers.Contract(factoryAddress, MarketFactoryABI.abi, provider)
      : undefined;

  const fetchMarkets = useCallback(async () => {
    if (!provider || !factoryContract || !factoryAddress) {
      console.log("Missing dependencies for fetchMarkets");
      return;
    }

    if (isFetching) {
      console.log("Already fetching, skipping...");
      return;
    }

    console.log("Fetching markets from factory:", factoryAddress);
    setIsFetching(true);
    setLoading(true);

    try {
      // Verificar si hay mercados
      const marketCount = await factoryContract.getMarketsCount();
      console.log("Market count:", marketCount.toNumber());

      if (marketCount.toNumber() === 0) {
        console.log("No markets found");
        setMarkets([]);
        return;
      }

      const marketAddresses = await factoryContract.getAllMarkets();
      console.log("Market addresses:", marketAddresses);

      // Procesar todos los mercados (o limitar si hay demasiados)
      const limitedAddresses = marketAddresses.slice(0, 10);

      const marketPromises = limitedAddresses.map(
        async (marketAddress: string, index: number) => {
          try {
            // Pequeño delay para evitar rate limiting
            if (index > 0) {
              await new Promise((resolve) => setTimeout(resolve, index * 50));
            }

            const marketContract = new ethers.Contract(
              marketAddress,
              PredictionMarketABI.abi,
              provider
            );

            // Get market data from the public market struct
            const marketData = await marketContract.market();

            return {
              address: marketAddress,
              assetName: marketData.assetName,
              baseAsset: marketData.baseAsset,
              targetPrice: marketData.targetPrice.toString(),
              resolutionTime: marketData.resolutionTime.toNumber(),
              totalHigherBets: marketData.totalHigherBets.toString(),
              totalLowerBets: marketData.totalLowerBets.toString(),
              isResolved: marketData.resolved,
              outcome: marketData.outcome, // true = HIGHER won, false = LOWER won
              creator: "", // Would need to track this separately
              finalPrice: marketData.finalPrice?.toString(),
              randomWinner: marketData.randomWinner,
              bonusAmount: marketData.randomBonusPool?.toString(),
              // New automation fields from market struct
              isAutomated: true, // All new markets are automated
              automationRegistered: marketData.automationRegistered,
              vrfRequested: false, // No direct way to check this
              vrfFulfilled: marketData.randomWinnerSelected,
              // Backward compatibility
              totalYesBets: marketData.totalHigherBets.toString(),
              totalNoBets: marketData.totalLowerBets.toString(),
              question: `Will ${marketData.assetName}/${
                marketData.baseAsset
              } be HIGHER than ${ethers.utils.formatUnits(
                marketData.targetPrice,
                8
              )} by ${new Date(
                marketData.resolutionTime * 1000
              ).toLocaleString()}?`,
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
      setMarkets(marketData);
    } catch (error) {
      console.error("Error fetching markets:", error);
      setMarkets([]);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, [factoryContract, provider, factoryAddress, isFetching]);

  const createMarket = useCallback(
    async (marketParams: {
      assetName: string;
      baseAsset: string;
      targetPrice: ethers.BigNumber;
      resolutionTime: number;
      priceFeed: string;
    }): Promise<string | null> => {
      if (!signer || !factoryContract) {
        console.error("No signer or factory contract available");
        return null;
      }

      try {
        console.log("Creating market with:", marketParams);
        console.log("Parameter types:");
        console.log(
          "- priceFeed:",
          typeof marketParams.priceFeed,
          marketParams.priceFeed
        );
        console.log(
          "- assetName:",
          typeof marketParams.assetName,
          marketParams.assetName
        );
        console.log(
          "- baseAsset:",
          typeof marketParams.baseAsset,
          marketParams.baseAsset
        );
        console.log(
          "- targetPrice:",
          typeof marketParams.targetPrice,
          marketParams.targetPrice.toString()
        );
        console.log(
          "- resolutionTime:",
          typeof marketParams.resolutionTime,
          marketParams.resolutionTime
        );

        // La función createMarket no es payable, no enviar ETH
        // Para ethers v5, no convertir números a string
        const tx = await factoryContract.connect(signer).createMarket(
          marketParams.priceFeed, // address _priceFeed
          marketParams.assetName, // string _assetName
          marketParams.baseAsset, // string _baseAsset
          marketParams.targetPrice, // uint256 _targetPrice (BigNumber)
          marketParams.resolutionTime // uint256 _resolutionTime (number)
        );
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
      amount: ethers.BigNumber,
      isHigher: boolean
    ): Promise<boolean> => {
      if (!signer) return false;

      try {
        const marketContract = new ethers.Contract(
          marketAddress,
          PredictionMarketABI.abi,
          signer
        );

        const tx = await marketContract.placeBet(amount, isHigher);
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

  const claimPayout = useCallback(
    async (marketAddress: string, betIndex: number): Promise<boolean> => {
      if (!signer) return false;

      try {
        const marketContract = new ethers.Contract(
          marketAddress,
          PredictionMarketABI.abi,
          signer
        );

        const tx = await marketContract.claimPayout(betIndex);
        await tx.wait();

        return true;
      } catch (error) {
        console.error("Error claiming payout:", error);
        return false;
      }
    },
    [signer]
  );

  const claimBonusReward = useCallback(
    async (marketAddress: string): Promise<boolean> => {
      if (!signer) return false;

      try {
        const marketContract = new ethers.Contract(
          marketAddress,
          PredictionMarketABI.abi,
          signer
        );

        const tx = await marketContract.claimBonusReward();
        await tx.wait();

        return true;
      } catch (error) {
        console.error("Error claiming bonus reward:", error);
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
          PredictionMarketABI.abi,
          provider
        );

        // Obtener datos del mercado para calcular odds
        const marketData = await marketContract.market();

        // Calcular odds basándose en las apuestas
        const totalHigher = parseFloat(
          ethers.utils.formatEther(marketData.totalHigherBets)
        );
        const totalLower = parseFloat(
          ethers.utils.formatEther(marketData.totalLowerBets)
        );
        const totalPool = totalHigher + totalLower;

        if (totalPool === 0) {
          // Si no hay apuestas, odds iguales
          return {
            higherOdds: 2.0,
            lowerOdds: 2.0,
            yesOdds: 2.0,
            noOdds: 2.0,
          };
        }

        // Calcular odds (inverso de la probabilidad implícita)
        const higherOdds = totalHigher === 0 ? 999 : totalPool / totalHigher;
        const lowerOdds = totalLower === 0 ? 999 : totalPool / totalLower;

        return {
          higherOdds: Math.max(1.01, higherOdds),
          lowerOdds: Math.max(1.01, lowerOdds),
          // Mantener compatibilidad hacia atrás
          yesOdds: Math.max(1.01, higherOdds),
          noOdds: Math.max(1.01, lowerOdds),
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
        return {
          higherBet: "0",
          lowerBet: "0",
          hasClaimed: false,
          betIndices: [] as number[],
        };

      try {
        // Agregar delay para evitar rate limiting
        await new Promise((resolve) => setTimeout(resolve, 50));

        const marketContract = new ethers.Contract(
          marketAddress,
          PredictionMarketABI.abi,
          provider
        );

        // Obtener el número total de apuestas del usuario
        const userBetCount = await marketContract.getUserBetCount(address);
        const betIndices: number[] = [];
        let totalHigherBet = ethers.BigNumber.from(0);
        let totalLowerBet = ethers.BigNumber.from(0);
        let hasClaimed = true; // Asumimos que ha reclamado todo hasta encontrar uno sin reclamar

        // Iterar por todas las apuestas del usuario
        for (let i = 0; i < userBetCount.toNumber(); i++) {
          // Obtener el betIndex del mapping público userBets
          const betIndex = await marketContract.userBets(address, i);
          const betInfo = await marketContract.getUserBet(address, i);
          const [amount, isHigher, claimed, payout] = betInfo;

          betIndices.push(betIndex.toNumber());

          if (isHigher) {
            totalHigherBet = totalHigherBet.add(amount);
          } else {
            totalLowerBet = totalLowerBet.add(amount);
          }

          // Si encuentra alguna apuesta sin reclamar, hasClaimed = false
          if (!claimed) {
            hasClaimed = false;
          }
        }

        return {
          higherBet: totalHigherBet.toString(),
          lowerBet: totalLowerBet.toString(),
          hasClaimed,
          betIndices,
          // Mantener compatibilidad hacia atrás
          yesBet: totalHigherBet.toString(),
          noBet: totalLowerBet.toString(),
        };
      } catch (error) {
        console.error("Error getting user bets:", error);
        return {
          higherBet: "0",
          lowerBet: "0",
          hasClaimed: false,
          betIndices: [] as number[],
        };
      }
    },
    [provider, address]
  );

  useEffect(() => {
    // Fetch markets cuando tenemos todos los requisitos y no estamos ya haciendo fetch
    if (
      provider &&
      factoryContract &&
      factoryAddress &&
      !isFetching &&
      !loading
    ) {
      console.log("Fetching markets on mount or dependency change");
      fetchMarkets();
    }
  }, []); // Agregamos las dependencias necesarias

  const claimPayouts = useCallback(
    async (marketAddress: string): Promise<boolean> => {
      if (!signer || !address) {
        console.error("Wallet not connected");
        return false;
      }

      try {
        const marketContract = new ethers.Contract(
          marketAddress,
          PredictionMarketABI.abi,
          signer
        );

        console.log("Claiming individual payouts for market:", marketAddress);

        // Get user's bet count and claim each bet individually
        const userBetCount = await marketContract.getUserBetCount(address);

        for (let i = 0; i < userBetCount.toNumber(); i++) {
          // Obtener el betIndex del mapping público userBets
          const betIndex = await marketContract.userBets(address, i);
          const betInfo = await marketContract.getUserBet(address, i);
          const [amount, isHigher, claimed, payout] = betInfo;

          if (!claimed && payout.gt(0)) {
            console.log(`Claiming payout for bet ${betIndex.toString()}`);
            const tx = await marketContract.claimPayout(betIndex);
            await tx.wait();
          }
        }

        // Check if user can claim bonus
        const canClaimBonus = await marketContract.canClaimBonus(address);
        if (canClaimBonus) {
          console.log("Claiming bonus reward");
          const tx = await marketContract.claimBonusReward();
          await tx.wait();
        }

        // Refresh markets after successful claim
        setTimeout(() => {
          fetchMarkets();
        }, 2000);

        return true;
      } catch (error) {
        console.error("Error claiming payouts:", error);
        return false;
      }
    },
    [signer, address, fetchMarkets]
  );

  const getPayoutInfo = useCallback(
    async (
      marketAddress: string
    ): Promise<{
      winningPayout: string;
      bonusPayout: string;
      totalPayout: string;
      hasWinnings: boolean;
      hasBonus: boolean;
      canClaim: boolean;
    }> => {
      if (!provider || !address) {
        return {
          winningPayout: "0",
          bonusPayout: "0",
          totalPayout: "0",
          hasWinnings: false,
          hasBonus: false,
          canClaim: false,
        };
      }

      try {
        const marketContract = new ethers.Contract(
          marketAddress,
          PredictionMarketABI.abi,
          provider
        );

        // Get market data to check if resolved
        const marketData = await marketContract.market();
        if (!marketData.resolved) {
          return {
            winningPayout: "0",
            bonusPayout: "0",
            totalPayout: "0",
            hasWinnings: false,
            hasBonus: false,
            canClaim: false,
          };
        }

        let totalWinningPayout = ethers.BigNumber.from(0);
        let totalCanClaim = false;

        // Check user's bets for winnings
        const userBetCount = await marketContract.getUserBetCount(address);

        for (let i = 0; i < userBetCount.toNumber(); i++) {
          const betInfo = await marketContract.getUserBet(address, i);
          console.log(`Bet ${i} info:`, betInfo);
          const [amount, isHigher, claimed, payout] = betInfo;
          console.log(`Bet ${i}:`, {
            amount: amount,
            isHigher,
            claimed,
            payout: payout,
          });

          if (!claimed && payout > 0) {
            totalWinningPayout = totalWinningPayout.add(payout);
            totalCanClaim = true;
          }
        }

        // Check for bonus eligibility
        const canClaimBonus = await marketContract.canClaimBonus(address);
        const bonusPayout = canClaimBonus
          ? marketData.randomBonusPool
          : ethers.BigNumber.from(0);

        const hasWinnings = totalWinningPayout.gt(0);
        const hasBonus = canClaimBonus;
        const totalPayout = totalWinningPayout.add(bonusPayout);

        return {
          winningPayout: totalWinningPayout.toString(),
          bonusPayout: bonusPayout.toString(),
          totalPayout: totalPayout.toString(),
          hasWinnings,
          hasBonus,
          canClaim: totalCanClaim || hasBonus,
        };
      } catch (error) {
        console.error("Error getting payout info:", error);
        return {
          winningPayout: "0",
          bonusPayout: "0",
          totalPayout: "0",
          hasWinnings: false,
          hasBonus: false,
          canClaim: false,
        };
      }
    },
    [address]
  );

  const manualResolve = useCallback(
    async (marketAddress: string): Promise<boolean> => {
      if (!signer || !address) {
        console.error("Wallet not connected");
        return false;
      }

      try {
        const marketContract = new ethers.Contract(
          marketAddress,
          PredictionMarketABI.abi,
          signer
        );

        console.log("Manually resolving market:", marketAddress);
        const tx = await marketContract.emergencyResolve();
        console.log("Transaction sent:", tx.hash);

        const receipt = await tx.wait();
        console.log("Transaction confirmed:", receipt.transactionHash);

        // Refresh markets after successful resolution
        setTimeout(() => {
          fetchMarkets();
        }, 2000);

        return true;
      } catch (error) {
        console.error("Error manually resolving market:", error);
        return false;
      }
    },
    [signer, address, fetchMarkets]
  );

  return {
    markets,
    loading,
    fetchMarkets,
    createMarket,
    placeBet,
    getUserBets,
    claimPayouts,
    getPayoutInfo,
    manualResolve,
    claimPayout,
    claimBonusReward,
    getMarketOdds,
  };
}
