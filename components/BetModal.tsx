import { FC, useState, useEffect } from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import {
  MemoizedX,
  MemoizedTrendingUp,
  MemoizedTrendingDown,
  MemoizedWallet,
} from "./MemoizedIcons";
import toast from "react-hot-toast";

import { Market } from "@/types/contracts";
import { formatAmount, formatPercentage } from "@/utils/formatters";
import { useTokenApproval } from "@/hooks/useTokenApproval";
import { useMarketContract } from "@/hooks/useMarketContract";

interface BetModalProps {
  market: Market;
  onClose: () => void;
  factoryAddress: string;
  nostronetAddress: string;
}

export const BetModal: FC<BetModalProps> = ({
  market,
  onClose,
  factoryAddress,
  nostronetAddress,
}) => {
  const { address } = useAccount();
  const [betPosition, setBetPosition] = useState<boolean>(true); // true = HIGHER, false = LOWER
  const [betAmount, setBetAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [userBalance, setUserBalance] = useState("0");
  const [allowance, setAllowance] = useState(ethers.BigNumber.from(0));
  const [decimals, setDecimals] = useState(6); // Default to 6 for NOS

  const { placeBet } = useMarketContract(factoryAddress);
  const { checkAllowance, approve, getBalance, getDecimals, isApproving } =
    useTokenApproval(nostronetAddress);

  const betAmountBN = betAmount
    ? ethers.utils.parseUnits(betAmount, decimals)
    : ethers.BigNumber.from(0);
  const needsApproval = allowance.lt(betAmountBN);

  useEffect(() => {
    if (!address) return;

    const fetchData = async () => {
      try {
        const balance = await getBalance(address);
        const allowanceAmount = await checkAllowance(market.address, address);

        const nostronetDecimals = await getDecimals();
        console.log("NOS Decimals:", nostronetDecimals);

        setDecimals(nostronetDecimals);

        const formattedBalance = ethers.utils.formatUnits(balance, decimals);
        setUserBalance(formattedBalance);
        setAllowance(allowanceAmount);
      } catch (error) {
        console.error("Error fetching token data:", error);
      }
    };

    fetchData();
  }, [address, nostronetAddress, market.address, decimals]);

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

  const handlePositionChange = (position: boolean) => {
    setBetPosition(position);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setBetAmount(value);
    }
  };

  const maxBetAmount = parseFloat(userBalance);
  const currentAmount = parseFloat(betAmount) || 0;

  // Calculate odds based on betting pool ratio
  const totalHigher = parseFloat(market.totalHigherBets || "0");
  const totalLower = parseFloat(market.totalLowerBets || "0");
  const totalPool = totalHigher + totalLower;

  // Simple odds calculation (can be improved with more sophisticated algorithm)
  const higherOdds =
    totalPool > 0 ? Math.max(10, (totalLower / totalHigher) * 100) : 100;
  const lowerOdds =
    totalPool > 0 ? Math.max(10, (totalHigher / totalLower) * 100) : 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Place Bet</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <MemoizedX className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <div className="text-sm text-gray-400 mb-2">Market</div>
          <div className="text-white">
            {market.question ||
              `${market.assetName} > $${formatAmount(market.targetPrice)}`}
          </div>
          <div className="text-sm text-gray-400 mt-1">
            Target: ${formatAmount(market.targetPrice)}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Position Selection */}
          <div>
            <div className="text-sm text-gray-400 mb-3">Select Position</div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handlePositionChange(true)}
                className={`p-4 rounded-lg border transition-all ${
                  betPosition
                    ? "border-green-500 bg-green-500/10 text-green-400"
                    : "border-gray-600 text-gray-400 hover:border-gray-500"
                }`}
              >
                <MemoizedTrendingUp className="w-6 h-6 mx-auto mb-2" />
                <div className="font-semibold">HIGHER</div>
                <div className="text-xs">+{formatPercentage(higherOdds)}</div>
              </button>
              <button
                type="button"
                onClick={() => handlePositionChange(false)}
                className={`p-4 rounded-lg border transition-all ${
                  !betPosition
                    ? "border-red-500 bg-red-500/10 text-red-400"
                    : "border-gray-600 text-gray-400 hover:border-gray-500"
                }`}
              >
                <MemoizedTrendingDown className="w-6 h-6 mx-auto mb-2" />
                <div className="font-semibold">LOWER</div>
                <div className="text-xs">+{formatPercentage(lowerOdds)}</div>
              </button>
            </div>
          </div>

          {/* Bet Amount */}
          <div>
            <div className="text-sm text-gray-400 mb-2">Bet Amount</div>
            <div className="relative">
              <input
                type="text"
                value={betAmount}
                onChange={handleAmountChange}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none pr-16"
                placeholder="0.0"
                style={{
                  MozAppearance: "textfield",
                  WebkitAppearance: "none",
                }}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">
                NOS
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 text-sm">
              <div className="flex items-center text-gray-400">
                <MemoizedWallet className="w-4 h-4 mr-1" />
                Balance: {maxBetAmount} NOS
              </div>
              {maxBetAmount > 0 && (
                <button
                  type="button"
                  onClick={() => setBetAmount(userBalance)}
                  className="text-blue-400 hover:text-blue-300"
                >
                  Max
                </button>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              loading ||
              isApproving ||
              !betAmount ||
              currentAmount <= 0 ||
              currentAmount > maxBetAmount
            }
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
              betPosition
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading || isApproving
              ? "Processing..."
              : needsApproval
              ? `Approve NOS`
              : `Bet ${betPosition ? "HIGHER" : "LOWER"}`}
          </button>
        </form>
      </div>
    </div>
  );
};
