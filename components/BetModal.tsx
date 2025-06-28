import { FC, useState, useEffect } from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { X, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import toast from "react-hot-toast";

import { Market } from "@/types/contracts";
import { formatAmount, formatPercentage } from "@/utils/formatters";
import { useTokenApproval } from "@/hooks/useTokenApproval";
import { useMarketContract } from "@/hooks/useMarketContract";

interface BetModalProps {
  market: Market;
  onClose: () => void;
  factoryAddress: string;
  usdcAddress: string;
}

export const BetModal: FC<BetModalProps> = ({
  market,
  onClose,
  factoryAddress,
  usdcAddress,
}) => {
  const { address } = useAccount();
  const [betPosition, setBetPosition] = useState<boolean>(true); // true = HIGHER, false = LOWER
  const [betAmount, setBetAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [userBalance, setUserBalance] = useState("0");
  const [allowance, setAllowance] = useState(ethers.BigNumber.from(0));

  const { placeBet } = useMarketContract(factoryAddress);
  const { checkAllowance, approve, getBalance, isApproving } =
    useTokenApproval(usdcAddress);

  const betAmountBN = betAmount
    ? ethers.utils.parseUnits(betAmount, 6)
    : ethers.BigNumber.from(0);
  const needsApproval = allowance.lt(betAmountBN);

  useEffect(() => {
    const fetchData = async () => {
      if (!address) return;

      try {
        const balance = await getBalance(address);
        setUserBalance(ethers.utils.formatUnits(balance, 6));

        const currentAllowance = await checkAllowance(market.address, address);
        setAllowance(currentAllowance);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchData();
  }, [address, market.address, getBalance, checkAllowance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!betAmount || parseFloat(betAmount) <= 0) {
      toast.error("Please enter a valid bet amount");
      return;
    }

    setLoading(true);
    try {
      if (needsApproval) {
        await approve(market.address, betAmountBN);
        // Refetch allowance after approval
        const newAllowance = await checkAllowance(market.address, address!);
        setAllowance(newAllowance);
      }

      const success = await placeBet(market.address, betAmountBN, betPosition);
      if (success) {
        toast.success(
          `${betPosition ? "HIGHER" : "LOWER"} bet placed successfully!`
        );
        onClose();
      } else {
        toast.error("Failed to place bet");
      }
    } catch (error) {
      console.error("Error placing bet:", error);
      toast.error("Failed to place bet");
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals and odds
  const totalPool =
    parseFloat(market.totalHigherBets) + parseFloat(market.totalLowerBets);
  const higherPercentage =
    totalPool > 0 ? (parseFloat(market.totalHigherBets) / totalPool) * 100 : 50;
  const lowerPercentage =
    totalPool > 0 ? (parseFloat(market.totalLowerBets) / totalPool) * 100 : 50;

  // Calculate potential payout
  const potentialPayout = betAmount
    ? betPosition
      ? (parseFloat(betAmount) * totalPool) /
        (parseFloat(market.totalHigherBets) + parseFloat(betAmount))
      : (parseFloat(betAmount) * totalPool) /
        (parseFloat(market.totalLowerBets) + parseFloat(betAmount))
    : 0;

  // Generate question from market data
  const question = `${market.assetName}/${
    market.baseAsset
  } Above $${formatAmount(market.targetPrice, 8)}`;

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Place Your Bet
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-6">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">
            {question}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Target: ${formatAmount(market.targetPrice, 8)} • Resolves:{" "}
            {new Date(market.resolutionTime * 1000).toLocaleString()}
          </p>
        </div>

        {/* Current Odds */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <TrendingUp
                  className="text-green-600 dark:text-green-400"
                  size={16}
                />
                <div className="ml-2">
                  <div className="font-medium text-green-900 dark:text-green-100">
                    HIGHER
                  </div>
                  <div className="text-xs text-green-700 dark:text-green-300">
                    {formatPercentage(higherPercentage)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <TrendingDown
                  className="text-red-600 dark:text-red-400"
                  size={16}
                />
                <div className="ml-2">
                  <div className="font-medium text-red-900 dark:text-red-100">
                    LOWER
                  </div>
                  <div className="text-xs text-red-700 dark:text-red-300">
                    {formatPercentage(lowerPercentage)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Position Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Prediction
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setBetPosition(true)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  betPosition
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100"
                    : "border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500"
                }`}
              >
                <div className="flex items-center justify-center">
                  <TrendingUp size={20} className="mr-2" />
                  <span className="font-medium">HIGHER</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setBetPosition(false)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  !betPosition
                    ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100"
                    : "border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500"
                }`}
              >
                <div className="flex items-center justify-center">
                  <TrendingDown size={20} className="mr-2" />
                  <span className="font-medium">LOWER</span>
                </div>
              </button>
            </div>
          </div>

          {/* Bet Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bet Amount (USDC)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter amount"
                required
              />
              <div className="absolute right-3 top-3 text-gray-500 dark:text-gray-400">
                USDC
              </div>
            </div>
            <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Balance: {formatAmount(userBalance, 6)} USDC</span>
              {potentialPayout > 0 && (
                <span>Potential payout: ${potentialPayout.toFixed(2)}</span>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              loading || isApproving || !betAmount || parseFloat(betAmount) <= 0
            }
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
              betPosition
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading || isApproving
              ? "Processing..."
              : needsApproval
              ? "Approve USDC"
              : `Place ${betPosition ? "HIGHER" : "LOWER"} Bet`}
          </button>
        </form>
      </div>
    </div>
  );
};
