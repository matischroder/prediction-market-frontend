import { useEffect, useState, useCallback, useRef } from "react";
import { useAccount } from "wagmi";
import { toast } from "react-hot-toast";
import { ethers } from "ethers";
import MarketFactoryABI from "../contracts/abis/MarketFactory.json";
import PredictionMarketABI from "../contracts/abis/PredictionMarket.json";
import { getContractAddress } from "../utils/contracts";

interface BetPlacedEvent {
  user: string;
  amount: string;
  isHigher: boolean;
  betIndex: string;
  marketAddress: string;
}

interface EventListenerOptions {
  marketAddress?: string;
  onBetPlaced?: (event: BetPlacedEvent) => void; // Callback para la MarketCard
  enableToasts?: boolean; // Para toasts globales
}

export function useRealtimeEvents({
  marketAddress,
  onBetPlaced,
  enableToasts = true,
}: EventListenerOptions = {}) {
  const { address: userAddress } = useAccount();
  const [eventCount, setEventCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("disconnected");
  const providerRef = useRef<ethers.providers.WebSocketProvider | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Toast global para nuevos mercados (solo si no hay marketAddress específico)
  const showNewMarketToast = useCallback(() => {
    if (enableToasts) {
      toast.success(`🆕 New prediction market created!`, {
        duration: 4000,
      });
    }
  }, [enableToasts]);

  // HANDLERS INTERNOS
  const handleBetPlaced = useCallback(
    (
      user: string,
      amount: ethers.BigNumber,
      isHigher: boolean,
      betIndex: ethers.BigNumber,
      eventMarketAddress: string
    ) => {
      console.log("🎯 BetPlaced event detected:", {
        user,
        amount: amount.toString(),
        isHigher,
        market: eventMarketAddress,
      });

      setEventCount((prev) => prev + 1);

      // Solo llamar callback si es de otro usuario (no el mío)
      if (user.toLowerCase() !== userAddress?.toLowerCase()) {
        const event: BetPlacedEvent = {
          user,
          amount: amount.toString(),
          isHigher,
          betIndex: betIndex.toString(),
          marketAddress: eventMarketAddress,
        };

        // Llamar al callback personalizado de la MarketCard
        onBetPlaced?.(event);
      }

      // Toast global opcional (solo si no hay callback específico)
      if (
        !onBetPlaced &&
        enableToasts &&
        user.toLowerCase() !== userAddress?.toLowerCase()
      ) {
        const direction = isHigher ? "HIGHER" : "LOWER";
        const formattedAmount = parseFloat(
          ethers.utils.formatUnits(amount, 6)
        ).toFixed(1);

        toast.success(`New bet: $${formattedAmount} on ${direction}`, {
          duration: 2000,
        });
      }
    },
    [userAddress, onBetPlaced, enableToasts]
  );

  const handleMarketResolved = useCallback(
    (
      outcome: boolean,
      finalPrice: ethers.BigNumber,
      timestamp: ethers.BigNumber,
      eventMarketAddress: string
    ) => {
      console.log("🏁 MarketResolved event detected:", {
        outcome,
        finalPrice: finalPrice.toString(),
        market: eventMarketAddress,
      });

      if (enableToasts) {
        const direction = outcome ? "HIGHER" : "LOWER";
        toast.custom(
          (t) => (
            <div
              className={`${
                outcome ? "bg-green-500" : "bg-red-500"
              } text-white p-4 rounded-lg shadow-lg animate-pulse`}
            >
              <div className="text-center">
                <div className="text-xl font-bold">🎯 Market Resolved!</div>
                <div className="text-sm">Result: {direction}</div>
                <div className="text-xs opacity-90">
                  Final Price: $
                  {parseFloat(ethers.utils.formatUnits(finalPrice, 8)).toFixed(
                    2
                  )}
                </div>
              </div>
            </div>
          ),
          {
            duration: 8000,
          }
        );
      }
    },
    [enableToasts]
  );

  const setupEventListeners = useCallback(async () => {
    if (!userAddress) return;

    // Usar WebSocket para tiempo real
    const wsUrl =
      process.env.NEXT_PUBLIC_SEPOLIA_WS_URL ||
      process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL?.replace(
        "https://",
        "wss://"
      ).replace("http://", "ws://");

    if (!wsUrl) {
      console.warn("No WebSocket URL configured for realtime events");
      return;
    }

    try {
      setConnectionStatus("connecting");

      // Crear WebSocket provider
      const provider = new ethers.providers.WebSocketProvider(wsUrl);
      providerRef.current = provider;

      if (marketAddress) {
        // Listen to specific market only
        const marketContract = new ethers.Contract(
          marketAddress,
          PredictionMarketABI.abi,
          provider
        );

        const betPlacedHandler = (
          user: string,
          amount: ethers.BigNumber,
          isHigher: boolean,
          betIndex: ethers.BigNumber
        ) => handleBetPlaced(user, amount, isHigher, betIndex, marketAddress);

        const marketResolvedHandler = (
          outcome: boolean,
          finalPrice: ethers.BigNumber,
          timestamp: ethers.BigNumber
        ) =>
          handleMarketResolved(outcome, finalPrice, timestamp, marketAddress);

        marketContract.on("BetPlaced", betPlacedHandler);
        marketContract.on("MarketResolved", marketResolvedHandler);

        cleanupRef.current = () => {
          marketContract.off("BetPlaced", betPlacedHandler);
          marketContract.off("MarketResolved", marketResolvedHandler);
          provider.destroy();
        };
      } else {
        // Listen to factory for all events
        const factoryAddress = getContractAddress("marketFactory");
        const factoryContract = new ethers.Contract(
          factoryAddress,
          MarketFactoryABI.abi,
          provider
        );

        const handleMarketCreated = (newMarketAddress: string) => {
          console.log("🆕 New market created:", newMarketAddress);
          showNewMarketToast();
        };

        factoryContract.on("MarketCreated", handleMarketCreated);

        cleanupRef.current = () => {
          factoryContract.off("MarketCreated", handleMarketCreated);
          provider.destroy();
        };
      }
    } catch (error) {
      console.error("Error setting up realtime events:", error);
      setConnectionStatus("disconnected");
    }
  }, [
    userAddress,
    marketAddress,
    handleBetPlaced,
    handleMarketResolved,
    showNewMarketToast,
  ]);

  useEffect(() => {
    setupEventListeners();

    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
      providerRef.current = null;
    };
  }, [setupEventListeners]);

  // Auto-reconnect cuando se desconecta
  useEffect(() => {
    if (connectionStatus === "disconnected" && userAddress) {
      const timer = setTimeout(() => {
        console.log("🔄 Attempting to reconnect...");
        setupEventListeners();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [connectionStatus, userAddress]);

  return {
    eventCount,
    connectionStatus,
  };
}
