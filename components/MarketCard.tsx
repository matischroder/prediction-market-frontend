import { FC, useState, useEffect } from 'react';
import { Market } from '@/types/contracts';
import { formatAmount, formatDate, calculateTimeLeft, formatPercentage, truncateText } from '@/utils/formatters';
import { Clock, Users, TrendingUp, Award } from 'lucide-react';
import { useMarketContract } from '@/hooks/useMarketContract';
import { BetModal } from './BetModal';

interface MarketCardProps {
  market: Market;
  factoryAddress: string;
  usdcAddress: string;
}

export const MarketCard: FC<MarketCardProps> = ({ market, factoryAddress, usdcAddress }) => {
  const [showBetModal, setShowBetModal] = useState(false);
  const [odds, setOdds] = useState({ yesOdds: 5000, noOdds: 5000 });
  const [userBets, setUserBets] = useState({ yesBet: '0', noBet: '0', hasClaimed: false });
  
  const { getMarketOdds, getUserBets } = useMarketContract(factoryAddress);

  useEffect(() => {
    const fetchData = async () => {
      const marketOdds = await getMarketOdds(market.address);
      if (marketOdds) {
        setOdds(marketOdds);
      }

      const bets = await getUserBets(market.address);
      setUserBets(bets);
    };

    fetchData();
  }, [market.address, getMarketOdds, getUserBets]);

  const totalPool = parseFloat(market.totalYesBets) + parseFloat(market.totalNoBets);
  const hasEnded = market.resolutionTime * 1000 < Date.now();
  const timeLeft = calculateTimeLeft(market.resolutionTime);
  
  const hasUserBets = parseFloat(userBets.yesBet) > 0 || parseFloat(userBets.noBet) > 0;
  const userTotalBet = parseFloat(userBets.yesBet) + parseFloat(userBets.noBet);

  return (
    <>
      <div className="card hover:shadow-md transition-shadow duration-200">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900 leading-tight">
            {truncateText(market.question, 100)}
          </h3>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            hasEnded 
              ? market.isResolved 
                ? 'bg-gray-100 text-gray-700' 
                : 'bg-orange-100 text-orange-700'
              : 'bg-green-100 text-green-700'
          }`}>
            {hasEnded 
              ? market.isResolved 
                ? 'Resolved' 
                : 'Pending'
              : 'Active'
            }
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Clock size={16} className="mr-2" />
            <span>
              {hasEnded ? `Ended ${formatDate(market.resolutionTime)}` : `Ends in ${timeLeft}`}
            </span>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <Users size={16} className="mr-2" />
            <span>Total Pool: {formatAmount(totalPool.toString(), 6)} USDC</span>
          </div>

          {hasUserBets && (
            <div className="flex items-center text-sm text-blue-600">
              <TrendingUp size={16} className="mr-2" />
              <span>Your bets: {formatAmount(userTotalBet.toString(), 6)} USDC</span>
            </div>
          )}
        </div>

        {/* Odds Display */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-success-50 border border-success-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-success-700">YES</span>
              <span className="text-lg font-bold text-success-800">
                {formatPercentage(odds.yesOdds)}
              </span>
            </div>
            <div className="text-xs text-success-600 mt-1">
              {formatAmount(market.totalYesBets, 6)} USDC
            </div>
          </div>

          <div className="bg-danger-50 border border-danger-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-danger-700">NO</span>
              <span className="text-lg font-bold text-danger-800">
                {formatPercentage(odds.noOdds)}
              </span>
            </div>
            <div className="text-xs text-danger-600 mt-1">
              {formatAmount(market.totalNoBets, 6)} USDC
            </div>
          </div>
        </div>

        {/* Resolution Display */}
        {market.isResolved && (
          <div className={`mb-4 p-3 rounded-lg border ${
            market.outcome 
              ? 'bg-success-50 border-success-200 text-success-800' 
              : 'bg-danger-50 border-danger-200 text-danger-800'
          }`}>
            <div className="flex items-center">
              <Award size={16} className="mr-2" />
              <span className="font-medium">
                Resolved: {market.outcome ? 'YES' : 'NO'} wins
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
            <button className="btn btn-success flex-1">
              Claim Prize
            </button>
          )}
          
          {(!hasUserBets || userBets.hasClaimed) && hasEnded && (
            <button className="btn btn-secondary flex-1" disabled>
              {market.isResolved ? 'Market Closed' : 'Awaiting Resolution'}
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
