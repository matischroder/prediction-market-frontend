import { FC, useState, useEffect } from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { X, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import toast from "react-hot-toast";

import { Market } from "@/types/contracts";
import { formatAmount, formatPercentage } from "@/utils/formatters";
import { usePlaceBet, useMarketOdds } from "@/hooks/useMarketQueries";
import { useTokenApproval } from "@/hooks/useTokenApproval";

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
  const [betPosition, setBetPosition] = useState<boolean>(true); // true = YES, false = NO
  const [betAmount, setBetAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [userBalance, setUserBalance] = useState("0");
  const [allowance, setAllowance] = useState(ethers.BigNumber.from(0));

  const placeBetMutation = usePlaceBet();
  const { data: odds } = useMarketOdds(market.address);
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

    // Debounce the data fetching to reduce requests
    const timeoutId = setTimeout(fetchData, 500);
    return () => clearTimeout(timeoutId);
  }, [address, getBalance, checkAllowance, market.address]);

  const handleApprove = async () => {
    if (!address) return;

    try {
      const success = await approve(
        market.address,
        ethers.constants.MaxUint256
      );
      if (success) {
        toast.success("USDC approved successfully!");
        setAllowance(ethers.constants.MaxUint256);
      } else {
        toast.error("Failed to approve USDC");
      }
    } catch (error) {
      console.error("Approval error:", error);
      toast.error("Approval failed");
    }
  };

  const handlePlaceBet = async () => {
    if (!address || !betAmount) return;

    const amount = parseFloat(betAmount);
    if (amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amount > parseFloat(userBalance)) {
      toast.error("Insufficient USDC balance");
      return;
    }

    setLoading(true);
    try {
      await placeBetMutation.mutateAsync({
        marketAddress: market.address,
        position: betPosition,
        amount: betAmountBN,
      });
      toast.success(`${betPosition ? "YES" : "NO"} bet placed successfully!`);
      onClose();
    } catch (error) {
      console.error("Bet placement error:", error);
      toast.error("Bet placement failed");
    } finally {
      setLoading(false);
    }
  };

  // Use odds from TanStack Query, fallback to market data for calculations
  const totalPool =
    parseFloat(market.totalYesBets) + parseFloat(market.totalNoBets);
  const currentYesOdds =
    odds?.yesOdds ??
    (totalPool > 0 ? (parseFloat(market.totalNoBets) / totalPool) * 100 : 50);
  const currentNoOdds =
    odds?.noOdds ??
    (totalPool > 0 ? (parseFloat(market.totalYesBets) / totalPool) * 100 : 50);

  // Calculate potential payout
  const potentialPayout = betAmount
    ? betPosition
      ? (parseFloat(betAmount) * (totalPool + parseFloat(betAmount))) /
        (parseFloat(market.totalYesBets) + parseFloat(betAmount))
      : (parseFloat(betAmount) * (totalPool + parseFloat(betAmount))) /
        (parseFloat(market.totalNoBets) + parseFloat(betAmount))
    : 0;

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
            {market.question}
          </h3>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Wallet size={16} className="mr-2" />
            <span>Balance: {formatAmount(userBalance, 0)} USDC</span>
          </div>
        </div>

        {/* Position Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Choose Position
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setBetPosition(true)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                betPosition
                  ? "border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 shadow-lg transform scale-105"
                  : "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-green-300 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
              }`}
            >
              <div className="flex items-center justify-center mb-2">
                <TrendingUp size={20} />
              </div>
              <div className="font-medium">YES</div>
              <div className="text-sm opacity-75">
                {formatPercentage(currentYesOdds * 100)}
              </div>
            </button>

            <button
              onClick={() => setBetPosition(false)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                !betPosition
                  ? "border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 shadow-lg transform scale-105"
                  : "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-red-300 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              }`}
            >
              <div className="flex items-center justify-center mb-2">
                <TrendingDown size={20} />
              </div>
              <div className="font-medium">NO</div>
              <div className="text-sm opacity-75">
                {formatPercentage(currentNoOdds * 100)}
              </div>
            </button>
          </div>
        </div>

        {/* Amount Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Bet Amount (USDC)
          </label>
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
            placeholder="0.00"
            min="0"
            step="0.01"
            max={userBalance}
          />
          <div className="flex justify-between mt-3">
            <div className="flex space-x-2">
              {["10", "50", "100"].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setBetAmount(amount)}
                  className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={parseFloat(amount) > parseFloat(userBalance)}
                >
                  {amount}
                </button>
              ))}
              <button
                onClick={() => setBetAmount(userBalance)}
                className="text-xs bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 px-3 py-2 rounded-lg transition-colors font-medium"
              >
                Max
              </button>
            </div>
          </div>
        </div>

        {/* Potential Payout */}
        {betAmount && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
            <div className="text-sm">
              <div className="flex justify-between mb-2 text-gray-700 dark:text-gray-300">
                <span>Your bet:</span>
                <span className="font-medium">{betAmount} USDC</span>
              </div>
              <div className="flex justify-between mb-2 text-gray-700 dark:text-gray-300">
                <span>Potential payout:</span>
                <span className="font-medium">
                  ~{potentialPayout.toFixed(2)} USDC
                </span>
              </div>
              <div className="flex justify-between font-semibold border-t border-blue-200 dark:border-blue-700 pt-2">
                <span className="text-gray-800 dark:text-gray-200">
                  Potential profit:
                </span>
                <span className="text-green-600 dark:text-green-400">
                  +{(potentialPayout - parseFloat(betAmount)).toFixed(2)} USDC
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {needsApproval && betAmount && (
            <button
              onClick={handleApprove}
              disabled={isApproving}
              className="w-full px-6 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <span>{isApproving ? "Approving..." : "Approve USDC"}</span>
              {isApproving && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
            </button>
          )}

          <button
            onClick={handlePlaceBet}
            disabled={
              loading ||
              placeBetMutation.isPending ||
              !betAmount ||
              parseFloat(betAmount) <= 0 ||
              parseFloat(betAmount) > parseFloat(userBalance) ||
              needsApproval
            }
            className={`w-full px-6 py-3 font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center space-x-2 ${
              betPosition
                ? "bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white shadow-lg hover:shadow-xl"
                : "bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white shadow-lg hover:shadow-xl"
            }`}
          >
            <span>
              {loading || placeBetMutation.isPending
                ? "Placing Bet..."
                : `Place ${betPosition ? "YES" : "NO"} Bet`}
            </span>
            {(loading || placeBetMutation.isPending) && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
