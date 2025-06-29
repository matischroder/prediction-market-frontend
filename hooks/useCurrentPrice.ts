import { useState, useEffect } from "react";
import { useContractRead } from "wagmi";
import { formatAmount } from "../utils/formatters";
import PredictionMarketABI from "../contracts/abis/PredictionMarket.json";

interface PriceData {
  price: string;
  formattedPrice: string;
  updatedAt: number;
  isLoading: boolean;
  error: string | null;
}

export function useCurrentPrice(marketAddress: string): PriceData {
  const [priceData, setPriceData] = useState<PriceData>({
    price: "0",
    formattedPrice: "$0.00",
    updatedAt: 0,
    isLoading: true,
    error: null,
  });

  // Get current price data from the market contract
  const {
    data: rawPriceData,
    error,
    refetch,
  } = useContractRead({
    address: marketAddress as `0x${string}`,
    abi: PredictionMarketABI.abi,
    functionName: "getLatestPriceData",
    enabled: !!marketAddress,
  });

  // Set up interval to refetch every 15 seconds
  useEffect(() => {
    if (!marketAddress) return;

    const interval = setInterval(() => {
      refetch();
    }, 15000); // 15 seconds

    return () => clearInterval(interval);
  }, [marketAddress, refetch]);

  useEffect(() => {
    if (rawPriceData) {
      try {
        // getLatestPriceData returns [roundId, price, startedAt, updatedAt, answeredInRound]
        const [, price, , updatedAt] = rawPriceData as [
          bigint,
          bigint,
          bigint,
          bigint,
          bigint
        ];

        setPriceData({
          price: price.toString(),
          formattedPrice: `$${formatAmount(price.toString(), 8)}`,
          updatedAt: Number(updatedAt),
          isLoading: false,
          error: null,
        });
      } catch (err) {
        console.error("Error parsing price data:", err);
        setPriceData((prev) => ({
          ...prev,
          isLoading: false,
          error: "Failed to parse price data",
        }));
      }
    } else if (error) {
      setPriceData((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Failed to fetch price",
      }));
    }
  }, [rawPriceData, error]);

  return priceData;
}

export function useSimpleCurrentPrice(marketAddress: string): {
  price: string;
  formattedPrice: string;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const {
    data: rawPrice,
    error,
    isLoading,
    refetch,
  } = useContractRead({
    address: marketAddress as `0x${string}`,
    abi: PredictionMarketABI.abi,
    functionName: "getCurrentPrice",
    enabled: !!marketAddress,
  });

  // Set up interval to refetch every 15 seconds
  useEffect(() => {
    if (!marketAddress) return;

    const interval = setInterval(() => {
      refetch();
    }, 15000); // 15 seconds

    return () => clearInterval(interval);
  }, [marketAddress, refetch]);

  if (isLoading) {
    return {
      price: "0",
      formattedPrice: "$0.00",
      isLoading: true,
      error: null,
      refetch,
    };
  }

  if (error) {
    return {
      price: "0",
      formattedPrice: "$0.00",
      isLoading: false,
      error: error.message || "Failed to fetch price",
      refetch,
    };
  }

  if (rawPrice) {
    const price = (rawPrice as bigint).toString();
    return {
      price,
      formattedPrice: `$${formatAmount(price, 8)}`,
      isLoading: false,
      error: null,
      refetch,
    };
  }

  return {
    price: "0",
    formattedPrice: "$0.00",
    isLoading: false,
    error: null,
    refetch,
  };
}
