import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useNetwork, useAccount } from 'wagmi';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Calendar, Users, TrendingUp, Award, ExternalLink } from 'lucide-react';

import { Market } from '@/types/contracts';
import { Header } from '@/components/Header';
import { BetModal } from '@/components/BetModal';
import { CreateMarketModal } from '@/components/CreateMarketModal';
import { useMarketContract } from '@/hooks/useMarketContract';
import { formatAmount, formatDate, calculateTimeLeft, formatPercentage, formatAddress } from '@/utils/formatters';
import addresses from '@/contracts/addresses.json';

export default function MarketDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { chain } = useNetwork();
  const { address } = useAccount();
  
  const [market, setMarket] = useState<Market | null>(null);
  const [showBetModal, setShowBetModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userBets, setUserBets] = useState({ yesBet: '0', noBet: '0', hasClaimed: false });
  const [odds, setOdds] = useState({ yesOdds: 5000, noOdds: 5000 });

  const chainName = chain?.name?.toLowerCase().includes('mumbai') 
    ? 'mumbai' 
    : chain?.name?.toLowerCase().includes('sepolia') 
    ? 'sepolia' 
    : 'mumbai';

  const contractAddresses = addresses[chainName as keyof typeof addresses];
  
  const {
    markets,
    createMarket,
    getMarketOdds,
    getUserBets,
    claimPrize
  } = useMarketContract(contractAddresses?.marketFactory || '');

  useEffect(() => {
    if (id && markets.length > 0) {
      const foundMarket = markets.find(m => m.address.toLowerCase() === (id as string).toLowerCase());
      if (foundMarket) {
        setMarket(foundMarket);
      }
    }
  }, [id, markets]);

  useEffect(() => {
    const fetchData = async () => {
      if (!market || !address) return;

      try {
        const marketOdds = await getMarketOdds(market.address);
        if (marketOdds) {
          setOdds(marketOdds);
        }

        const bets = await getUserBets(market.address);
        setUserBets(bets);
      } catch (error) {
        console.error('Error fetching market data:', error);
      }
    };

    fetchData();
  }, [market, address, getMarketOdds, getUserBets]);

  if (!market) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onCreateMarket={() => setShowCreateModal(true)} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading market...</p>
          </div>
        </div>
      </div>
    );
  }

  const totalPool = parseFloat(market.totalYesBets) + parseFloat(market.totalNoBets);
  const hasEnded = market.resolutionTime * 1000 < Date.now();
  const timeLeft = calculateTimeLeft(market.resolutionTime);
  const hasUserBets = parseFloat(userBets.yesBet) > 0 || parseFloat(userBets.noBet) > 0;
  const userTotalBet = parseFloat(userBets.yesBet) + parseFloat(userBets.noBet);

  return (
    <>
      <Head>
        <title>{market.question} - Prediction Market</title>
        <meta name="description" content={`Bet on: ${market.question}`} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Header onCreateMarket={() => setShowCreateModal(true)} />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <div className="mb-6">
            <Link href="/" className="inline-flex items-center text-primary-600 hover:text-primary-700">
              <ArrowLeft size={20} className="mr-2" />
              Back to Markets
            </Link>
          </div>

          {/* Market Header */}
          <div className="card mb-8">
            <div className="flex justify-between items-start mb-6">
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                {market.question}
              </h1>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                hasEnded 
                  ? market.isResolved 
                    ? 'bg-gray-100 text-gray-700' 
                    : 'bg-orange-100 text-orange-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {hasEnded 
                  ? market.isResolved 
                    ? 'Resolved' 
                    : 'Pending Resolution'
                  : 'Active'
                }
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="flex items-center text-gray-600">
                <Calendar size={20} className="mr-3" />
                <div>
                  <div className="text-sm text-gray-500">Resolution Time</div>
                  <div className="font-medium">
                    {hasEnded ? `Ended ${formatDate(market.resolutionTime)}` : timeLeft}
                  </div>
                </div>
              </div>

              <div className="flex items-center text-gray-600">
                <Users size={20} className="mr-3" />
                <div>
                  <div className="text-sm text-gray-500">Total Pool</div>
                  <div className="font-medium">{formatAmount(totalPool.toString(), 6)} USDC</div>
                </div>
              </div>

              <div className="flex items-center text-gray-600">
                <ExternalLink size={20} className="mr-3" />
                <div>
                  <div className="text-sm text-gray-500">Contract</div>
                  <div className="font-medium">{formatAddress(market.address)}</div>
                </div>
              </div>
            </div>

            {hasUserBets && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center mb-2">
                  <TrendingUp size={20} className="text-blue-600 mr-2" />
                  <span className="font-medium text-blue-900">Your Position</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">YES Bet: </span>
                    <span className="font-medium">{formatAmount(userBets.yesBet, 6)} USDC</span>
                  </div>
                  <div>
                    <span className="text-blue-700">NO Bet: </span>
                    <span className="font-medium">{formatAmount(userBets.noBet, 6)} USDC</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <span className="text-blue-700">Total Bet: </span>
                  <span className="font-medium text-blue-900">
                    {formatAmount(userTotalBet.toString(), 6)} USDC
                  </span>
                </div>
              </div>
            )}

            {/* Resolution Result */}
            {market.isResolved && (
              <div className={`p-4 rounded-lg border mb-6 ${
                market.outcome 
                  ? 'bg-success-50 border-success-200' 
                  : 'bg-danger-50 border-danger-200'
              }`}>
                <div className="flex items-center">
                  <Award size={20} className={`mr-2 ${
                    market.outcome ? 'text-success-600' : 'text-danger-600'
                  }`} />
                  <span className={`font-medium text-lg ${
                    market.outcome ? 'text-success-800' : 'text-danger-800'
                  }`}>
                    Market Resolved: {market.outcome ? 'YES' : 'NO'} wins!
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Odds and Betting */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Odds Display */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-6">Current Odds</h2>
              
              <div className="space-y-4">
                <div className="bg-success-50 border border-success-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-semibold text-success-700">YES</span>
                    <span className="text-2xl font-bold text-success-800">
                      {formatPercentage(odds.yesOdds)}
                    </span>
                  </div>
                  <div className="text-sm text-success-600">
                    {formatAmount(market.totalYesBets, 6)} USDC backed
                  </div>
                  <div className="mt-2 bg-success-100 rounded-full h-2">
                    <div 
                      className="bg-success-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(odds.yesOdds / 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-semibold text-danger-700">NO</span>
                    <span className="text-2xl font-bold text-danger-800">
                      {formatPercentage(odds.noOdds)}
                    </span>
                  </div>
                  <div className="text-sm text-danger-600">
                    {formatAmount(market.totalNoBets, 6)} USDC backed
                  </div>
                  <div className="mt-2 bg-danger-100 rounded-full h-2">
                    <div 
                      className="bg-danger-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(odds.noOdds / 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-6">Actions</h2>
              
              <div className="space-y-4">
                {!hasEnded && !market.isResolved && (
                  <button
                    onClick={() => setShowBetModal(true)}
                    className="btn btn-primary w-full"
                  >
                    Place Bet
                  </button>
                )}
                
                {market.isResolved && hasUserBets && !userBets.hasClaimed && (
                  <button
                    onClick={() => claimPrize(market.address)}
                    className="btn btn-success w-full"
                  >
                    Claim Prize
                  </button>
                )}
                
                {userBets.hasClaimed && (
                  <div className="text-center text-success-600 font-medium">
                    ✅ Prize Claimed
                  </div>
                )}

                {(!hasUserBets || userBets.hasClaimed) && hasEnded && (
                  <div className="text-center text-gray-500">
                    {market.isResolved ? 'Market has ended' : 'Awaiting resolution'}
                  </div>
                )}
              </div>

              {/* Market Info */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="font-medium text-gray-900 mb-4">Market Details</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Resolution Date:</span>
                    <span>{formatDate(market.resolutionTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Volume:</span>
                    <span>{formatAmount(totalPool.toString(), 6)} USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Contract:</span>
                    <span>{formatAddress(market.address)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {showBetModal && (
          <BetModal
            market={market}
            onClose={() => setShowBetModal(false)}
            factoryAddress={contractAddresses?.marketFactory || ''}
            usdcAddress={contractAddresses?.usdc || ''}
          />
        )}

        {showCreateModal && (
          <CreateMarketModal
            onClose={() => setShowCreateModal(false)}
            onCreate={createMarket}
          />
        )}
      </div>
    </>
  );
}
