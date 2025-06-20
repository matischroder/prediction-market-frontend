import { FC, useState } from "react";
import { Market } from "@/types/contracts";
import {
  formatAmount,
  formatDate,
  calculateTimeLeft,
  formatPercentage,
  truncateText,
} from "@/utils/formatters";
import { Clock, Users, TrendingUp, Award } from "lucide-react";
import { useMarketData } from "@/context/MarketContext";
import { BetModal } from "./BetModal";

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

  // Usar el hook optimizado que maneja cache automáticamente
  const { odds, userBets, isLoading } = useMarketData(market.address);

  const totalPool =
    parseFloat(market.totalYesBets) + parseFloat(market.totalNoBets);
  const hasEnded = market.resolutionTime * 1000 < Date.now();
  const timeLeft = calculateTimeLeft(market.resolutionTime);

  const hasUserBets =
    parseFloat(userBets.yesBet) > 0 || parseFloat(userBets.noBet) > 0;
  const userTotalBet = parseFloat(userBets.yesBet) + parseFloat(userBets.noBet);

  return (
    <>
      <div className="card hover:shadow-md transition-shadow duration-200 market-card">
        <div className="flex justify-between items-start mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-palette-text-light dark:text-palette-text-dark leading-tight">
            {truncateText(market.question, 100)}
          </h3>
          <div
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              market.isResolved
                ? "bg-palette-accent-light text-palette-text-light dark:bg-palette-accent-dark dark:text-palette-text-dark"
                : "bg-success-50 text-success-700 dark:bg-success-600 dark:text-success-50"
            }`}
          >
            {hasEnded ? (market.isResolved ? "Resolved" : "Pending") : "Active"}
          </div>
        </div>

        <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
          <div className="flex items-center text-xs sm:text-sm text-palette-text-light dark:text-palette-text-dark">
            <Clock size={16} className="mr-2" />
            <span>
              {hasEnded
                ? `Ended ${formatDate(market.resolutionTime)}`
                : `Ends in ${timeLeft}`}
            </span>
          </div>

          <div className="flex items-center text-xs sm:text-sm text-palette-text-light dark:text-palette-text-dark">
            <Users size={16} className="mr-2" />
            <span>
              Total Pool: {formatAmount(totalPool.toString(), 6)} USDC
            </span>
          </div>

          {hasUserBets && (
            <div className="flex items-center text-xs sm:text-sm text-palette-primary-light dark:text-palette-primary-dark">
              <TrendingUp size={16} className="mr-2" />
              <span>
                Your bets: {formatAmount(userTotalBet.toString(), 6)} USDC
              </span>
            </div>
          )}
        </div>

        {/* Odds Display */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="bg-success-50 border border-success-200 rounded-lg p-2 sm:p-3 dark:bg-success-600/20 dark:border-success-600/40">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-success-700 dark:text-success-400">
                YES
              </span>
              <span className="text-base sm:text-lg font-bold text-success-800 dark:text-success-300">
                {formatPercentage(odds.yesOdds)}
              </span>
            </div>
            <div className="text-xs text-success-600 mt-1 dark:text-success-400">
              {formatAmount(market.totalYesBets, 6)} USDC
            </div>
          </div>

          <div className="bg-danger-50 border border-danger-200 rounded-lg p-2 sm:p-3 dark:bg-danger-600/20 dark:border-danger-600/40">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-danger-700 dark:text-danger-400">
                NO
              </span>
              <span className="text-base sm:text-lg font-bold text-danger-800 dark:text-danger-300">
                {formatPercentage(odds.noOdds)}
              </span>
            </div>
            <div className="text-xs text-danger-600 mt-1 dark:text-danger-400">
              {formatAmount(market.totalNoBets, 6)} USDC
            </div>
          </div>
        </div>

        {/* Resolution Display */}
        {market.isResolved && (
          <div
            className={`mb-4 p-3 rounded-lg border ${
              market.outcome
                ? "bg-success-50 border-success-200 text-success-800"
                : "bg-danger-50 border-danger-200 text-danger-800"
            }`}
          >
            <div className="flex items-center">
              <Award size={16} className="mr-2" />
              <span className="font-medium">
                Resolved: {market.outcome ? "YES" : "NO"} wins
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {!hasEnded && !market.isResolved && (
            <button
              onClick={() => setShowBetModal(true)}
              className="btn btn-primary flex-1"
            >
              Place Bet
            </button>
          )}

          {market.isResolved && hasUserBets && !userBets.hasClaimed && (
            <button className="btn btn-success flex-1">Claim Prize</button>
          )}

          {(!hasUserBets || userBets.hasClaimed) && hasEnded && (
            <button className="btn btn-secondary flex-1" disabled>
              {market.isResolved ? "Market Closed" : "Awaiting Resolution"}
            </button>
          )}
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
    </>
  );
};
