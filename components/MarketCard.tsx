import { FC, useState, useEffect } from "react";
import { Market, PayoutInfo } from "@/types/contracts";
import {
  formatAmount,
  formatDate,
  calculateTimeLeftDetailed,
  formatPercentage,
  truncateText,
} from "@/utils/formatters";
import {
  Clock,
  Users,
  TrendingUp,
  TrendingDown,
  Award,
  Zap,
  Gift,
  DollarSign,
} from "lucide-react";
import { useMarketContract } from "@/hooks/useMarketContract";
import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";
import { useSimpleCurrentPrice } from "@/hooks/useCurrentPrice";
import { BetModal } from "./BetModal";
import { MarketDetailsModal } from "./MarketDetailsModal";
import { CountdownBar } from "./CountdownBar";
import toast from "react-hot-toast";
import { ethers } from "ethers";

interface MarketCardProps {
  market: Market;
  factoryAddress: string;
  nostronetAddress: string;
}

export const MarketCard: FC<MarketCardProps> = ({
  market,
  factoryAddress,
  nostronetAddress,
}) => {
  const [showBetModal, setShowBetModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(
    calculateTimeLeftDetailed(market.resolutionTime)
  );
  const [payoutInfo, setPayoutInfo] = useState<PayoutInfo | null>(null);
  const [isClaimingPayouts, setIsClaimingPayouts] = useState(false);

  // Estado para la animación
  const [showBetAnimation, setShowBetAnimation] = useState(false);
  const [animationData, setAnimationData] = useState<{
    amount: string;
    isHigher: boolean;
  } | null>(null);

  const { getUserBets, getPayoutInfo, claimPayouts, manualResolve } =
    useMarketContract(factoryAddress);

  const currentPrice = useSimpleCurrentPrice(market.address);

  // Handler para animación de nuevas apuestas
  const handleNewBet = (event: any) => {
    const formattedAmount = parseFloat(
      ethers.utils.formatUnits(event.amount, 6)
    ).toFixed(1);

    setAnimationData({
      amount: formattedAmount,
      isHigher: event.isHigher,
    });
    setShowBetAnimation(true);

    setTimeout(() => {
      setShowBetAnimation(false);
      setAnimationData(null);
    }, 3000);
  };

  // Realtime events
  useRealtimeEvents({
    marketAddress: market.address,
    onBetPlaced: handleNewBet,
    enableToasts: false,
  });

  // Update timeLeft every second
  useEffect(() => {
    const updateTimeLeft = () => {
      setTimeLeft(calculateTimeLeftDetailed(market.resolutionTime));
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [market.resolutionTime]);

  // Load payout info for resolved markets
  useEffect(() => {
    const loadPayoutInfo = async () => {
      if (market.isResolved && getPayoutInfo) {
        const info = await getPayoutInfo(market.address);
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

  const question = `${market.assetName}/${
    market.baseAsset
  } Price $${formatAmount(market.targetPrice, 8)}`;

  return (
    <>
      <div className="card hover:shadow-md transition-shadow duration-200 market-card relative overflow-hidden flex flex-col h-full">
        {/* Animación de nueva apuesta */}
        {showBetAnimation && animationData && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-green-500/20 backdrop-blur-sm animate-pulse">
            <div
              className={`text-3xl font-bold ${
                animationData.isHigher ? "text-green-600" : "text-red-600"
              } bg-white/90 px-6 py-4 rounded-lg shadow-lg animate-bounce`}
            >
              +${animationData.amount} NOS
              <div className="text-lg text-center mt-1">
                {animationData.isHigher ? "📈 HIGHER" : "📉 LOWER"}
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-start flex-shrink-0">
          <h3 className="text-base sm:text-lg font-semibold text-palette-text-light dark:text-palette-text-dark leading-tight pr-4">
            {truncateText(question, 80)}
          </h3>
          <div className="flex items-center gap-2 flex-shrink-0">
            {market.isAutomated && !market.automationRegistered && (
              <div
                className="flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 dark:bg-yellow-600 dark:text-yellow-50"
                title="Automation registration pending"
              >
                <Clock size={12} className="mr-1" />
                Automation Pending
              </div>
            )}

            {!market.isResolved && hasEnded ? (
              <div
                className="flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 dark:bg-orange-600 dark:text-orange-50"
                title="Market expired - needs manual resolution"
              >
                <Clock size={12} className="mr-1" />
                Needs Resolution
              </div>
            ) : (
              <div
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  market.isResolved
                    ? "bg-palette-accent-light text-palette-text-light dark:bg-palette-accent-dark dark:text-palette-text-dark"
                    : "bg-success-50 text-success-700 dark:bg-success-600 dark:text-success-50"
                }`}
              >
                {market.isResolved ? "Resolved" : "Active"}
              </div>
            )}
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-grow flex flex-col justify-between">
          <div className="flex flex-col space-y-4 flex-grow">
            {/* Market Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-600 dark:text-gray-400">
                  Target Price:
                </span>
                <span className="font-semibold">
                  ${formatAmount(market.targetPrice, 8)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400 font-medium">
                  Current Price:
                </span>
                <div className="flex items-center">
                  {currentPrice.isLoading ? (
                    <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-4 w-16 rounded"></div>
                  ) : currentPrice.error ? (
                    <span className="text-red-500 text-xs">
                      Error loading price
                    </span>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {currentPrice.formattedPrice}
                      </span>
                      <div
                        className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                        title="Live price"
                      ></div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                <Clock size={14} className="mr-2 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  {hasEnded ? (
                    <span>Ended {formatDate(market.resolutionTime)}</span>
                  ) : (
                    <div className="space-y-2">
                      <span
                        className={
                          timeLeft.isUrgent
                            ? "animate-pulse text-red-600 font-semibold"
                            : ""
                        }
                      >
                        {timeLeft.text}
                      </span>
                      <CountdownBar
                        totalSeconds={timeLeft.totalSeconds}
                        isUrgent={timeLeft.isUrgent}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center">
                  <Users size={14} className="mr-2" />
                  <span>Total Pool:</span>
                </div>
                <span className="font-semibold">
                  ${formatAmount(totalPool.toString(), 6)}
                </span>
              </div>

              {/* Automation status */}
              {market.isAutomated &&
                (!market.automationRegistered ||
                  (market.isResolved && !market.vrfFulfilled) ||
                  (market.isResolved && market.randomWinner)) && (
                  <div className="space-y-2 text-xs p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    {!market.automationRegistered && (
                      <div className="flex items-center text-yellow-600 dark:text-yellow-400">
                        <Clock size={12} className="mr-2 flex-shrink-0" />
                        <span>Automation pending registration</span>
                      </div>
                    )}

                    {market.isResolved && !market.vrfFulfilled && (
                      <div className="flex items-center text-orange-600 dark:text-orange-400">
                        <Zap size={12} className="mr-2 flex-shrink-0" />
                        <span>VRF random selection pending</span>
                      </div>
                    )}

                    {market.isResolved && market.randomWinner && (
                      <div className="flex items-center text-purple-600 dark:text-purple-400">
                        <Gift size={12} className="mr-2 flex-shrink-0" />
                        <span>
                          Random winner: {market.randomWinner.slice(0, 8)}...
                        </span>
                        {market.bonusAmount &&
                          ` (+$${formatAmount(market.bonusAmount, 6)})`}
                      </div>
                    )}
                  </div>
                )}

              {/* Odds Display */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <TrendingUp
                      className="text-green-600 dark:text-green-400"
                      size={18}
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-green-900 dark:text-green-100">
                        HIGHER
                      </div>
                      <div className="text-xs text-green-700 dark:text-green-300 mt-1">
                        {formatPercentage(higherPercentage)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <TrendingDown
                      className="text-red-600 dark:text-red-400"
                      size={18}
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-red-900 dark:text-red-100">
                        LOWER
                      </div>
                      <div className="text-xs text-red-700 dark:text-red-300 mt-1">
                        {formatPercentage(lowerPercentage)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Resolution Info */}
            {market.isResolved && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Award className="text-yellow-500" size={18} />
                    <span className="ml-3 text-sm font-medium">
                      {market.outcome ? "HIGHER" : "LOWER"} Won
                    </span>
                  </div>
                  {market.finalPrice && (
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      Final: ${formatAmount(market.finalPrice, 8)}
                    </span>
                  )}
                </div>
                {market.randomWinner && market.bonusAmount && (
                  <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                    Bonus winner: {market.randomWinner.slice(0, 6)}...
                    {market.randomWinner.slice(-4)}
                    (+${formatAmount(market.bonusAmount, 6)})
                  </div>
                )}
              </div>
            )}

            {/* Payout Info */}
            {market.isResolved && payoutInfo && payoutInfo.canClaim && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <DollarSign
                      className="text-green-600 dark:text-green-400"
                      size={18}
                    />
                    <span className="ml-3 text-sm font-medium text-green-900 dark:text-green-100">
                      Available Payouts
                    </span>
                  </div>
                  <span className="text-sm font-bold text-green-700 dark:text-green-300">
                    ${formatAmount(payoutInfo.totalPayout, 6)}
                  </span>
                </div>

                <div className="space-y-2">
                  {payoutInfo.hasWinnings && (
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      🏆 Winning bet: $
                      {formatAmount(payoutInfo.winningPayout, 6)}
                    </div>
                  )}

                  {payoutInfo.hasBonus && (
                    <div className="text-xs text-purple-600 dark:text-purple-400">
                      🎁 Random bonus: $
                      {formatAmount(payoutInfo.bonusPayout, 6)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 flex-shrink-0">
            {!market.isResolved && !hasEnded && (
              <button
                onClick={() => setShowBetModal(true)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors"
              >
                Place Bet
              </button>
            )}

            {!market.isResolved && hasEnded && (
              <button
                onClick={handleManualResolve}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                title="Market expired but not resolved - resolve manually"
              >
                <Clock size={16} className="mr-2" />
                Resolve Manually
              </button>
            )}

            {market.isResolved && payoutInfo && payoutInfo.canClaim && (
              <button
                onClick={handleClaimPayouts}
                disabled={isClaimingPayouts}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
              >
                {isClaimingPayouts ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Claiming...
                  </>
                ) : (
                  <>
                    <DollarSign size={16} className="mr-2" />
                    Claim ${formatAmount(payoutInfo.totalPayout, 6)}
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => setShowDetailsModal(true)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Details
            </button>
          </div>
        </div>
      </div>

      {showBetModal && (
        <BetModal
          market={market}
          onClose={() => setShowBetModal(false)}
          factoryAddress={factoryAddress}
          nostronetAddress={nostronetAddress}
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
