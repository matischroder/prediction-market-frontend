import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useProvider, useSigner, useAccount } from 'wagmi';
import { Market, MarketOdds } from '@/types/contracts';

const MARKET_FACTORY_ABI = [
  "function getAllMarkets() view returns (address[])",
  "function getMarketsCount() view returns (uint256)",
  "function createMarket(string memory question, uint256 resolutionTime) returns (address)"
];

const PREDICTION_MARKET_ABI = [
  "function getMarketInfo() view returns (string memory question, uint256 resolutionTime, uint256 totalYesBets, uint256 totalNoBets, bool isResolved, bool outcome)",
  "function getCurrentOdds() view returns (uint256 yesOdds, uint256 noOdds)",
  "function placeBet(bool position, uint256 amount)",
  "function claimPrize()",
  "function yesBets(address) view returns (uint256)",
  "function noBets(address) view returns (uint256)",
  "function hasClaimed(address) view returns (bool)"
];

export function useMarketContract(factoryAddress: string) {
  const provider = useProvider();
  const { data: signer } = useSigner();
  const { address } = useAccount();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(false);

  const factoryContract = new ethers.Contract(
    factoryAddress,
    MARKET_FACTORY_ABI,
    signer || provider
  );

  const fetchMarkets = useCallback(async () => {
    if (!provider) return;

    setLoading(true);
    try {
      const marketAddresses = await factoryContract.getAllMarkets();
      const marketPromises = marketAddresses.map(async (marketAddress: string) => {
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
          creator: '' // Would need to track this separately
        } as Market;
      });

      const marketData = await Promise.all(marketPromises);
      setMarkets(marketData);
    } catch (error) {
      console.error('Error fetching markets:', error);
    } finally {
      setLoading(false);
    }
  }, [factoryContract, provider]);

  const createMarket = useCallback(async (
    question: string,
    resolutionTime: number
  ): Promise<string | null> => {
    if (!signer) return null;

    try {
      const tx = await factoryContract.connect(signer).createMarket(question, resolutionTime);
      const receipt = await tx.wait();
      
      // Refresh markets after creation
      await fetchMarkets();
      
      return receipt.transactionHash;
    } catch (error) {
      console.error('Error creating market:', error);
      return null;
    }
  }, [factoryContract, signer, fetchMarkets]);

  const placeBet = useCallback(async (
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
      console.error('Error placing bet:', error);
      return false;
    }
  }, [signer, fetchMarkets]);

  const claimPrize = useCallback(async (marketAddress: string): Promise<boolean> => {
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
      console.error('Error claiming prize:', error);
      return false;
    }
  }, [signer]);

  const getMarketOdds = useCallback(async (marketAddress: string): Promise<MarketOdds | null> => {
    if (!provider) return null;

    try {
      const marketContract = new ethers.Contract(
        marketAddress,
        PREDICTION_MARKET_ABI,
        provider
      );
      
      const odds = await marketContract.getCurrentOdds();
      
      return {
        yesOdds: odds.yesOdds.toNumber(),
        noOdds: odds.noOdds.toNumber()
      };
    } catch (error) {
      console.error('Error getting odds:', error);
      return null;
    }
  }, [provider]);

  const getUserBets = useCallback(async (marketAddress: string) => {
    if (!provider || !address) return { yesBet: '0', noBet: '0', hasClaimed: false };

    try {
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
        hasClaimed
      };
    } catch (error) {
      console.error('Error getting user bets:', error);
      return { yesBet: '0', noBet: '0', hasClaimed: false };
    }
  }, [provider, address]);

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  return {
    markets,
    loading,
    fetchMarkets,
    createMarket,
    placeBet,
    claimPrize,
    getMarketOdds,
    getUserBets
  };
}
