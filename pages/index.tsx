import { useState, useEffect } from 'react';
import { useNetwork } from 'wagmi';
import Head from 'next/head';
import { Header } from '@/components/Header';
import { MarketCard } from '@/components/MarketCard';
import { CreateMarketModal } from '@/components/CreateMarketModal';
import { useMarketContract } from '@/hooks/useMarketContract';
import { Search, Filter, TrendingUp, Users, DollarSign } from 'lucide-react';
import addresses from '@/contracts/addresses.json';

export default function Home() {
  const { chain } = useNetwork();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');

  // Get contract addresses for current chain
  const chainName = chain?.name?.toLowerCase().includes('mumbai') 
    ? 'mumbai' 
    : chain?.name?.toLowerCase().includes('sepolia') 
    ? 'sepolia' 
    : 'mumbai'; // default

  const contractAddresses = addresses[chainName as keyof typeof addresses];
  
  const {
    markets,
    loading,
    createMarket,
  } = useMarketContract(contractAddresses?.marketFactory || '');

  // Filter markets based on search and filter
  const filteredMarkets = markets.filter(market => {
    const matchesSearch = market.question.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (filter === 'active') {
      return !market.isResolved && market.resolutionTime * 1000 > Date.now();
    }
    
    if (filter === 'resolved') {
      return market.isResolved;
    }
    
    return true; // 'all'
  });

  // Calculate stats
  const totalMarkets = markets.length;
  const activeMarkets = markets.filter(m => !m.isResolved && m.resolutionTime * 1000 > Date.now()).length;
  const totalVolume = markets.reduce((sum, market) => {
    return sum + parseFloat(market.totalYesBets) + parseFloat(market.totalNoBets);
  }, 0);

  return (
    <>
      <Head>
        <title>Prediction Markets - Decentralized Betting Platform</title>
        <meta name="description" content="Decentralized prediction markets powered by Chainlink" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Header onCreateMarket={() => setShowCreateModal(true)} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Decentralized Prediction Markets
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Bet on real-world events with transparent, automated resolution powered by Chainlink oracles.
              Cross-chain compatible with verifiable randomness and proof of reserves.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="text-primary-600" size={24} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{totalMarkets}</div>
              <div className="text-sm text-gray-600">Total Markets</div>
            </div>
            
            <div className="card text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="text-success-600" size={24} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{activeMarkets}</div>
              <div className="text-sm text-gray-600">Active Markets</div>
            </div>
            
            <div className="card text-center">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="text-blue-600" size={24} />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {(totalVolume / 1000000).toFixed(1)}K
              </div>
              <div className="text-sm text-gray-600">Total Volume (USDC)</div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search markets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter size={20} className="text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'active' | 'resolved')}
                className="input min-w-32"
              >
                <option value="all">All Markets</option>
                <option value="active">Active</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          {/* Markets Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4 w-2/3"></div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="h-16 bg-gray-200 rounded"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredMarkets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMarkets.map((market) => (
                <MarketCard
                  key={market.address}
                  market={market}
                  factoryAddress={contractAddresses?.marketFactory || ''}
                  usdcAddress={contractAddresses?.usdc || ''}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <TrendingUp size={48} className="mx-auto" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {searchTerm || filter !== 'all' ? 'No markets found' : 'No markets yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Be the first to create a prediction market!'
                }
              </p>
              {(!searchTerm && filter === 'all') && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn btn-primary"
                >
                  Create First Market
                </button>
              )}
            </div>
          )}

          {/* Network Warning */}
          {!contractAddresses && (
            <div className="mt-8 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="text-orange-800">
                <strong>Network not supported:</strong> Please connect to Polygon Mumbai or Ethereum Sepolia testnet.
              </div>
            </div>
          )}
        </main>

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
