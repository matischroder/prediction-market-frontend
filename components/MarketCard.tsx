import { FC, useState, useEffect } from "react";
import { Market, PayoutInfo } from "@/types/contracts";
import {
  formatAmount,
  formatDate,
  calculateTimeLeft,
  formatPercentage,
  truncateText,
} from "@/utils/formatters";
import {
  Clock,
  Users,
  TrendingUp,
  TrendingDown,
  Award,
  Bot,
  CheckCircle,
  Zap,
  Gift,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { useMarketContract } from "@/hooks/useMarketContract";
import { BetModal } from "./BetModal";
import { MarketDetailsModal } from "./MarketDetailsModal";
import toast from "react-hot-toast";

interface MarketCardProps {
  market: Market;
  factoryAddress: string;
  usdcAddress: string;
}

export const MarketCard: FC<MarketCardProps> = ({
  market,
  factoryAddress,
  usdcAddress,
}) => {
  const [showBetModal, setShowBetModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(
    calculateTimeLeft(market.resolutionTime)
  );
  const [payoutInfo, setPayoutInfo] = useState<PayoutInfo | null>(null);
  const [isClaimingPayouts, setIsClaimingPayouts] = useState(false);
  const { getUserBets, getPayoutInfo, claimPayouts, manualResolve } =
    useMarketContract(factoryAddress);

  // Update timeLeft every second
  useEffect(() => {
    const updateTimeLeft = () => {
      setTimeLeft(calculateTimeLeft(market.resolutionTime));
    };

    // Update immediately
    updateTimeLeft();

    // Set up interval to update every second
    const interval = setInterval(updateTimeLeft, 1000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [market.resolutionTime]);

  // Load payout info for resolved markets
  useEffect(() => {
    const loadPayoutInfo = async () => {
      if (market.isResolved && getPayoutInfo) {
        const info = await getPayoutInfo(market.address);
        console.log("Payout Info:", info);
        setPayoutInfo(info);
      }
    };

    loadPayoutInfo();
  }, [market.isResolved, market.address, getPayoutInfo]);

  const handleClaimPayouts = async () => {
    if (!claimPayouts || isClaimingPayouts) return;

    setIsClaimingPayouts(true);

    try {
      const success = await claimPayouts(market.address);

      if (success) {
        toast.success("Payouts claimed successfully!");
        // Refresh payout info
        if (getPayoutInfo) {
          const info = await getPayoutInfo(market.address);
          setPayoutInfo(info);
        }
      } else {
        toast.error("Failed to claim payouts");
      }
    } catch (error) {
      console.error("Error claiming payouts:", error);
      toast.error("Error claiming payouts");
    } finally {
      setIsClaimingPayouts(false);
    }
  };

  const handleManualResolve = async () => {
    if (!manualResolve) return;

    try {
      const success = await manualResolve(market.address);

      if (success) {
        toast.success("Market resolved manually!");
      } else {
        toast.error("Failed to resolve market");
      }
    } catch (error) {
      console.error("Error resolving market:", error);
      toast.error("Error resolving market");
    }
  };

  const totalPool =
    parseFloat(market.totalHigherBets) + parseFloat(market.totalLowerBets);
  const hasEnded = market.resolutionTime * 1000 < Date.now();

  const higherPercentage =
    totalPool > 0 ? (parseFloat(market.totalHigherBets) / totalPool) * 100 : 50;
  const lowerPercentage =
    totalPool > 0 ? (parseFloat(market.totalLowerBets) / totalPool) * 100 : 50;

  // Generate question from market data
  const question = `${market.assetName}/${
    market.baseAsset
  } Price $${formatAmount(market.targetPrice, 8)}`;

  return (
    <>
      <div className="card hover:shadow-md transition-shadow duration-200 market-card">
        <div className="flex justify-between items-start mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-palette-text-light dark:text-palette-text-dark leading-tight">
            {truncateText(question, 80)}
          </h3>
          <div className="flex items-center gap-2">
            {/* Show automation issues */}
            {market.isAutomated && !market.automationRegistered && (
              <div
                className="flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 dark:bg-yellow-600 dark:text-yellow-50"
                title="Automation registration pending"
              >
                <Clock size={12} className="mr-1" />
                Automation Pending
              </div>
            )}

            {!market.isResolved && hasEnded && (
              <div
                className="flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 dark:bg-orange-600 dark:text-orange-50"
                title="Market expired - needs manual resolution"
              >
                <Clock size={12} className="mr-1" />
                Needs Resolution
              </div>
            )}

            <div
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                market.isResolved
                  ? "bg-palette-accent-light text-palette-text-light dark:bg-palette-accent-dark dark:text-palette-text-dark"
                  : "bg-success-50 text-success-700 dark:bg-success-600 dark:text-success-50"
              }`}
            >
              {market.isResolved ? "Resolved" : "Active"}
            </div>
          </div>
        </div>

        {/* Market Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Target Price:</span>
            <span className="ml-1">${formatAmount(market.targetPrice, 8)}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Clock size={14} className="mr-1" />
            {hasEnded ? (
              <span>Ended {formatDate(market.resolutionTime)}</span>
            ) : (
              <span>{timeLeft}</span>
            )}
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Users size={14} className="mr-1" />
            <span>Pool: ${formatAmount(totalPool.toString(), 6)}</span>
          </div>

          {/* Automation status - only show if there are issues */}
          {market.isAutomated && (
            <div className="space-y-1 text-xs">
              {!market.automationRegistered && (
                <div className="flex items-center text-yellow-600 dark:text-yellow-400">
                  <Clock size={12} className="mr-1" />
                  <span>Automation pending registration</span>
                </div>
              )}

              {market.isResolved && !market.vrfFulfilled && (
                <div className="flex items-center text-orange-600 dark:text-orange-400">
                  <Zap size={12} className="mr-1" />
                  <span>VRF random selection pending</span>
                </div>
              )}

              {market.isResolved && market.randomWinner && (
                <div className="flex items-center text-purple-600 dark:text-purple-400">
                  <Gift size={12} className="mr-1" />
                  <span>
                    Random winner: {market.randomWinner.slice(0, 8)}...
                  </span>
                  {market.bonusAmount &&
                    ` (+$${formatAmount(market.bonusAmount, 6)})`}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Odds Display */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <div className="flex items-center">
              <TrendingUp
                className="text-green-600 dark:text-green-400"
                size={16}
              />
              <div className="ml-2">
                <div className="text-sm font-medium text-green-900 dark:text-green-100">
                  HIGHER
                </div>
                <div className="text-xs text-green-700 dark:text-green-300">
                  {formatPercentage(higherPercentage)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div className="flex items-center">
              <TrendingDown
                className="text-red-600 dark:text-red-400"
                size={16}
              />
              <div className="ml-2">
                <div className="text-sm font-medium text-red-900 dark:text-red-100">
                  LOWER
                </div>
                <div className="text-xs text-red-700 dark:text-red-300">
                  {formatPercentage(lowerPercentage)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resolution Info */}
        {market.isResolved && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Award className="text-yellow-500" size={16} />
                <span className="ml-2 text-sm font-medium">
                  {market.outcome ? "HIGHER" : "LOWER"} Won
                </span>
              </div>
              {market.finalPrice && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Final: ${formatAmount(market.finalPrice, 8)}
                </span>
              )}
            </div>
            {market.randomWinner && market.bonusAmount && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Bonus winner: {market.randomWinner.slice(0, 6)}...
                {market.randomWinner.slice(-4)}
                (+${formatAmount(market.bonusAmount, 6)})
              </div>
            )}
          </div>
        )}

        {/* Payout Info for Resolved Markets */}
        {market.isResolved && payoutInfo && payoutInfo.canClaim && (
          <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <DollarSign
                  className="text-green-600 dark:text-green-400"
                  size={16}
                />
                <span className="ml-2 text-sm font-medium text-green-900 dark:text-green-100">
                  Available Payouts
                </span>
              </div>
              <span className="text-sm font-bold text-green-700 dark:text-green-300">
                ${formatAmount(payoutInfo.totalPayout, 6)}
              </span>
            </div>

            {payoutInfo.hasWinnings && (
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                🏆 Winning bet: ${formatAmount(payoutInfo.winningPayout, 6)}
              </div>
            )}

            {payoutInfo.hasBonus && (
              <div className="text-xs text-purple-600 dark:text-purple-400">
                🎁 Random bonus: ${formatAmount(payoutInfo.bonusPayout, 6)}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!market.isResolved && !hasEnded && (
            <button
              onClick={() => setShowBetModal(true)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Place Bet
            </button>
          )}

          {/* Manual resolution for expired markets where automation failed */}
          {!market.isResolved && hasEnded && (
            <button
              onClick={handleManualResolve}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
              title="Market expired but not resolved - resolve manually"
            >
              <Clock size={16} className="mr-1" />
              Resolve Manually
            </button>
          )}

          {/* Claim payouts for resolved markets */}
          {market.isResolved && payoutInfo && payoutInfo.canClaim && (
            <button
              onClick={handleClaimPayouts}
              disabled={isClaimingPayouts}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
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

          {/* Details button - always available */}
          <button
            onClick={() => setShowDetailsModal(true)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Details
          </button>
        </div>
      </div>

      {showBetModal && (
        <BetModal
          market={market}
          onClose={() => setShowBetModal(false)}
          factoryAddress={factoryAddress}
          usdcAddress={usdcAddress}
        />
      )}

      {showDetailsModal && (
        <MarketDetailsModal
          market={market}
          payoutInfo={payoutInfo}
          onClose={() => setShowDetailsModal(false)}
          onClaimPayouts={handleClaimPayouts}
          onManualResolve={handleManualResolve}
          isClaimingPayouts={isClaimingPayouts}
        />
      )}
    </>
  );
};
