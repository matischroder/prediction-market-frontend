import { useState, useEffect } from "react";
import { useContractRead } from "wagmi";
import { formatAmount } from "../utils/formatters";

// ABI mínimo para el price feed de Chainlink
const CHAINLINK_AGGREGATOR_ABI = [
  {
    inputs: [],
    name: "latestRoundData",
    outputs: [
      { internalType: "uint80", name: "roundId", type: "uint80" },
      { internalType: "int256", name: "answer", type: "int256" },
      { internalType: "uint256", name: "startedAt", type: "uint256" },
      { internalType: "uint256", name: "updatedAt", type: "uint256" },
      { internalType: "uint80", name: "answeredInRound", type: "uint80" },
    ],
    stateMutability: "view",
    type: "function",
  },
];

interface FeedPriceData {
  price: string;
  formattedPrice: string;
  updatedAt: number;
  roundId: string;
  isLoading: boolean;
  error: string | null;
}

export function useFeedPrice(feedAddress: string): FeedPriceData {
  const [priceData, setPriceData] = useState<FeedPriceData>({
    price: "0",
    formattedPrice: "$0.00",
    updatedAt: 0,
    roundId: "0",
    isLoading: true,
    error: null,
  });

  // Get latest round data from the price feed
  const {
    data: rawPriceData,
    error,
    refetch,
  } = useContractRead({
    address: feedAddress as `0x${string}`,
    abi: CHAINLINK_AGGREGATOR_ABI,
    functionName: "latestRoundData",
    enabled:
      !!feedAddress &&
      feedAddress !== "0x0000000000000000000000000000000000000000",
  });

  // Set up interval to refetch every 15 seconds
  useEffect(() => {
    if (
      !feedAddress ||
      feedAddress === "0x0000000000000000000000000000000000000000"
    )
      return;

    const interval = setInterval(() => {
      refetch();
    }, 15000); // 15 seconds

    return () => clearInterval(interval);
  }, [feedAddress, refetch]);

  useEffect(() => {
    if (rawPriceData) {
      try {
        // latestRoundData returns [roundId, answer, startedAt, updatedAt, answeredInRound]
        const [roundId, answer, , updatedAt] = rawPriceData as [
          bigint,
          bigint,
          bigint,
          bigint,
          bigint
        ];

        setPriceData({
          price: answer.toString(),
          formattedPrice: `$${formatAmount(answer.toString(), 8)}`,
          updatedAt: Number(updatedAt),
          roundId: roundId.toString(),
          isLoading: false,
          error: null,
        });
      } catch (err) {
        console.error("Error parsing feed price data:", err);
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

export function useSimpleFeedPrice(feedAddress: string): {
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
    address: feedAddress as `0x${string}`,
    abi: CHAINLINK_AGGREGATOR_ABI,
    functionName: "latestRoundData",
    enabled:
      !!feedAddress &&
      feedAddress !== "0x0000000000000000000000000000000000000000",
  });

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
    // latestRoundData returns [roundId, answer, startedAt, updatedAt, answeredInRound]
    const [, answer] = rawPrice as [bigint, bigint, bigint, bigint, bigint];
    const price = answer.toString();
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
