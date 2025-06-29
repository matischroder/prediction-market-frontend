import { FC, useState, useEffect, useMemo } from "react";
import {
  useAccount,
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
} from "wagmi";
import { ethers } from "ethers";
import { MemoizedClock, MemoizedGift } from "./MemoizedIcons";
import addresses from "@/contracts/addresses.json";
import { formatAmount } from "@/utils/formatters";

const NOSTRONET_ABI = [
  {
    inputs: [],
    name: "claimFaucet",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "canClaimFaucet",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "timeUntilNextClaim",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "FAUCET_AMOUNT",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

interface ClaimNosButtonProps {
  onClaimed?: () => void;
}

export const ClaimNosButton: FC<ClaimNosButtonProps> = ({ onClaimed }) => {
  const { address, isConnected } = useAccount();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [mounted, setMounted] = useState(false);

  // Check if user can claim
  const { data: canClaim, refetch: refetchCanClaim } = useContractRead({
    address: addresses.contracts.nostronet as `0x${string}`,
    abi: NOSTRONET_ABI,
    functionName: "canClaimFaucet",
    args: [address],
    enabled: !!address && isConnected,
    watch: false, // Disable automatic polling
    cacheTime: 60_000, // Cache for 1 minute
    staleTime: 30_000, // Consider data stale after 30 seconds
  });

  // Get time until next claim
  const { data: timeUntilNextClaim, refetch: refetchTime } = useContractRead({
    address: addresses.contracts.nostronet as `0x${string}`,
    abi: NOSTRONET_ABI,
    functionName: "timeUntilNextClaim",
    args: [address],
    enabled: !!address && isConnected,
    watch: false, // Disable automatic polling
    cacheTime: 60_000, // Cache for 1 minute
    staleTime: 30_000, // Consider data stale after 30 seconds
  });

  // Get faucet amount (this rarely changes, so cache longer)
  const { data: faucetAmount } = useContractRead({
    address: addresses.contracts.nostronet as `0x${string}`,
    abi: NOSTRONET_ABI,
    functionName: "FAUCET_AMOUNT",
    watch: false, // Disable automatic polling
    cacheTime: 5 * 60_000, // Cache for 5 minutes
    staleTime: 5 * 60_000, // Consider data stale after 5 minutes
  });

  // Prepare claim transaction
  const { config } = usePrepareContractWrite({
    address: addresses.contracts.nostronet as `0x${string}`,
    abi: NOSTRONET_ABI,
    functionName: "claimFaucet",
    enabled: !!canClaim && isConnected,
  });

  const { write: claimFaucet, isLoading: isClaiming } = useContractWrite({
    ...config,
    onSuccess: () => {
      // Refetch data after successful claim
      setTimeout(() => {
        refetchCanClaim();
        refetchTime();
        onClaimed?.();
      }, 2000);
    },
  });

  // Update countdown timer
  useEffect(() => {
    setMounted(true);
    if (!timeUntilNextClaim || canClaim) return;

    // Calculate initial time left based on contract data
    const initialTimeLeft = Number(timeUntilNextClaim);
    setTimeLeft(initialTimeLeft);

    // Always update every second for accuracy, but we'll handle display smartly
    const countdownInterval = setInterval(() => {
      setTimeLeft((prevTime) => {
        const newTime = Math.max(0, prevTime - 1);

        if (newTime <= 0) {
          // When countdown reaches zero, refetch to check if user can claim
          refetchCanClaim();
          refetchTime();
        }

        return newTime;
      });
    }, 1000);

    // Sync with contract every 2 hours to prevent drift
    const syncInterval = setInterval(() => {
      refetchCanClaim();
      refetchTime();
    }, 2 * 60 * 60 * 1000); // 2 hours

    return () => {
      clearInterval(countdownInterval);
      clearInterval(syncInterval);
    };
  }, [timeUntilNextClaim, canClaim, refetchCanClaim, refetchTime]);

  // Memoized display time - only updates when minutes change if showing hours
  const displayTime = useMemo(() => {
    if (timeLeft <= 0) return "Ready to claim!";

    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const secs = timeLeft % 60;

    // If more than 1 hour, show hours and minutes only (ignore seconds for smoother display)
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    // If less than 1 hour, show minutes and seconds with precise countdown
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }, [
    // Only re-calculate when these values change
    timeLeft <= 0 ? 0 : timeLeft > 3600 ? Math.floor(timeLeft / 60) : timeLeft,
  ]);

  if (!mounted || !isConnected) {
    return null;
  }

  const faucetAmountFormatted = faucetAmount
    ? formatAmount(faucetAmount.toString(), 6)
    : "50";

  return (
    <div className="flex items-center">
      {canClaim ? (
        <button
          onClick={() => claimFaucet?.()}
          disabled={isClaiming}
          className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-300 flex items-center space-x-2 disabled:opacity-50"
        >
          <MemoizedGift size={16} />
          <span>
            {isClaiming ? "Claiming..." : `Claim ${faucetAmountFormatted}`}
          </span>
        </button>
      ) : (
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg">
          <MemoizedClock size={16} />
          <span>{displayTime}</span>
        </div>
      )}
    </div>
  );
};
