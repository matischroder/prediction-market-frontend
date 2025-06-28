import { FC, useState, useEffect } from "react";
import { Market, PayoutInfo } from "@/types/contracts";
import {
  X,
  ExternalLink,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Award,
  Bot,
  CheckCircle,
  Zap,
  Gift,
  Clock,
  AlertCircle,
  Copy,
} from "lucide-react";
import {
  formatAmount,
  formatDate,
  calculateTimeLeft,
  formatAddress,
} from "@/utils/formatters";
import toast from "react-hot-toast";

interface MarketDetailsModalProps {
  market: Market;
  payoutInfo?: PayoutInfo | null;
  onClose: () => void;
  onClaimPayouts?: () => void;
  onManualResolve?: () => void;
  isClaimingPayouts?: boolean;
}

export const MarketDetailsModal: FC<MarketDetailsModalProps> = ({
  market,
  payoutInfo,
  onClose,
  onClaimPayouts,
  onManualResolve,
  isClaimingPayouts = false,
}) => {
  const [timeLeft, setTimeLeft] = useState(
    calculateTimeLeft(market.resolutionTime)
  );

  useEffect(() => {
    const updateTimeLeft = () => {
      setTimeLeft(calculateTimeLeft(market.resolutionTime));
    };
    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [market.resolutionTime]);

  const totalPool =
    parseFloat(market.totalHigherBets) + parseFloat(market.totalLowerBets);
  const higherPercentage =
    totalPool > 0 ? (parseFloat(market.totalHigherBets) / totalPool) * 100 : 50;
  const lowerPercentage =
    totalPool > 0 ? (parseFloat(market.totalLowerBets) / totalPool) * 100 : 50;
  const hasEnded = market.resolutionTime * 1000 < Date.now();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const openEtherscan = (address: string) => {
    window.open(`https://sepolia.etherscan.io/address/${address}`, "_blank");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-90vh overflow-y-auto border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Market Details
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {market.assetName}/{market.baseAsset} Price Prediction
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Market Question */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Prediction Question
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              Will {market.assetName}/{market.baseAsset} be HIGHER or LOWER than
              ${formatAmount(market.targetPrice, 8)} by{" "}
              {formatDate(market.resolutionTime)}?
            </p>
          </div>

          {/* Price Comparison - Only show for resolved markets */}
          {market.isResolved && market.finalPrice && (
            <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <div className="flex items-center mb-4">
                <Award className="text-yellow-500 mr-2" size={20} />
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  Price Comparison & Result
                </h4>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Target Price
                  </div>
                  <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    ${formatAmount(market.targetPrice, 8)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Prediction threshold
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Final Price
                  </div>
                  <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    ${formatAmount(market.finalPrice, 8)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    At resolution
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Result
                  </div>
                  <div
                    className={`text-xl font-bold ${
                      market.outcome ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {market.outcome ? "HIGHER" : "LOWER"}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {market.outcome
                      ? `+${formatAmount(
                          (
                            parseFloat(market.finalPrice) -
                            parseFloat(market.targetPrice)
                          ).toString(),
                          8
                        )}`
                      : `${formatAmount(
                          (
                            parseFloat(market.finalPrice) -
                            parseFloat(market.targetPrice)
                          ).toString(),
                          8
                        )}`}
                  </div>
                </div>
              </div>

              {/* Visual comparison */}
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Final price was{" "}
                    <span
                      className={`font-semibold ${
                        market.outcome ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {parseFloat(market.finalPrice) >
                      parseFloat(market.targetPrice)
                        ? `$${formatAmount(
                            (
                              parseFloat(market.finalPrice) -
                              parseFloat(market.targetPrice)
                            ).toString(),
                            8
                          )} HIGHER`
                        : `$${formatAmount(
                            (
                              parseFloat(market.targetPrice) -
                              parseFloat(market.finalPrice)
                            ).toString(),
                            8
                          )} LOWER`}
                    </span>{" "}
                    than the target price
                  </span>
                </div>
              </div>

              {/* Random Winner Info */}
              {market.randomWinner && market.bonusAmount && (
                <div className="mt-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                  <div className="flex items-center mb-2">
                    <Gift
                      className="text-purple-600 dark:text-purple-400 mr-2"
                      size={16}
                    />
                    <span className="font-semibold text-purple-900 dark:text-purple-100">
                      Random Bonus Winner
                    </span>
                  </div>
                  <div className="text-sm text-purple-700 dark:text-purple-300">
                    Winner: {formatAddress(market.randomWinner)}
                  </div>
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    Bonus: ${formatAmount(market.bonusAmount, 6)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Market Stats Grid - Only show basic stats for unresolved markets */}
          {!market.isResolved && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  ${formatAmount(totalPool.toString(), 6)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Pool
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {hasEnded ? "Ended" : timeLeft}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {hasEnded ? "Status" : "Time Left"}
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {higherPercentage.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  HIGHER Bets
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {lowerPercentage.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  LOWER Bets
                </div>
              </div>
            </div>
          )}

          {/* Betting Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <TrendingUp
                  className="text-green-600 dark:text-green-400 mr-2"
                  size={20}
                />
                <h4 className="font-semibold text-green-900 dark:text-green-100">
                  HIGHER Bets
                </h4>
              </div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100 mb-1">
                ${formatAmount(market.totalHigherBets, 6)}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">
                {higherPercentage.toFixed(1)}% of total pool
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <TrendingDown
                  className="text-red-600 dark:text-red-400 mr-2"
                  size={20}
                />
                <h4 className="font-semibold text-red-900 dark:text-red-100">
                  LOWER Bets
                </h4>
              </div>
              <div className="text-2xl font-bold text-red-900 dark:text-red-100 mb-1">
                ${formatAmount(market.totalLowerBets, 6)}
              </div>
              <div className="text-sm text-red-700 dark:text-red-300">
                {lowerPercentage.toFixed(1)}% of total pool
              </div>
            </div>
          </div>

          {/* Automation Status - Only show if there are issues */}
          {(!market.automationRegistered ||
            (market.isResolved && !market.vrfFulfilled)) && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle
                  className="text-yellow-600 dark:text-yellow-400 mr-3 mt-1"
                  size={20}
                />
                <div>
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                    Automation Status
                  </h4>
                  <div className="space-y-2 text-sm">
                    {!market.automationRegistered && (
                      <div className="flex items-center text-yellow-700 dark:text-yellow-300">
                        <Clock size={14} className="mr-2" />
                        Chainlink Automation registration pending
                      </div>
                    )}
                    {market.isResolved && !market.vrfFulfilled && (
                      <div className="flex items-center text-yellow-700 dark:text-yellow-300">
                        <Zap size={14} className="mr-2" />
                        VRF random selection pending
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payout Information */}
          {market.isResolved && payoutInfo && payoutInfo.canClaim && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <DollarSign
                    className="text-green-600 dark:text-green-400 mr-2"
                    size={20}
                  />
                  <h4 className="font-semibold text-green-900 dark:text-green-100">
                    Available Payouts
                  </h4>
                </div>
                <div className="text-xl font-bold text-green-700 dark:text-green-300">
                  ${formatAmount(payoutInfo.totalPayout, 6)}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {payoutInfo.hasWinnings && (
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>🏆 Winning bet payout:</span>
                    <span className="font-medium">
                      ${formatAmount(payoutInfo.winningPayout, 6)}
                    </span>
                  </div>
                )}
                {payoutInfo.hasBonus && (
                  <div className="flex justify-between text-purple-600 dark:text-purple-400">
                    <span>🎁 Random bonus:</span>
                    <span className="font-medium">
                      ${formatAmount(payoutInfo.bonusPayout, 6)}
                    </span>
                  </div>
                )}
              </div>

              {onClaimPayouts && (
                <button
                  onClick={onClaimPayouts}
                  disabled={isClaimingPayouts}
                  className="w-full mt-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  {isClaimingPayouts ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Claiming...
                    </>
                  ) : (
                    <>
                      <DollarSign size={16} className="mr-1" />
                      Claim ${formatAmount(payoutInfo.totalPayout, 6)}
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Manual Resolution for Failed Automation */}
          {!market.isResolved &&
            hasEnded &&
            (!market.automationRegistered || !market.vrfFulfilled) &&
            onManualResolve && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle
                    className="text-orange-600 dark:text-orange-400 mr-3 mt-1"
                    size={20}
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                      Manual Resolution Required
                    </h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                      This market has expired but automation failed. Manual
                      resolution is required.
                    </p>
                    <button
                      onClick={onManualResolve}
                      className="bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                    >
                      Resolve Market Manually
                    </button>
                  </div>
                </div>
              </div>
            )}

          {/* Contract Information */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Contract Information
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Market Contract:
                </span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
                    {formatAddress(market.address)}
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(market.address, "Contract address")
                    }
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={() => openEtherscan(market.address)}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Resolution Date:
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatDate(market.resolutionTime)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Target Price:
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  ${formatAmount(market.targetPrice, 8)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
