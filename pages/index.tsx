import { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import { ethers } from "ethers";
import { MarketCard } from "@/components/MarketCard";
import addresses from "@/contracts/addresses.json";
import {
  MemoizedSearch,
  MemoizedFilter,
  MemoizedTrendingUp,
  MemoizedPlusCircle,
  MemoizedGift,
} from "@/components/MemoizedIcons";
import { CreateMarketModal } from "@/components/CreateMarketModal";
import { ClaimNosButton } from "@/components/ClaimNosButton";
import { useMarkets } from "@/context/MarketContext";
import {
  usePopularFeedsFromContext,
  useAllFeedsFromContext,
} from "@/context/ChainlinkFeedsContext";
import { GlobalStats } from "@/components/GlobalStats";

interface HomeProps {
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;
  onCreateMarket: () => void;
}

export default function Home({
  showCreateModal,
  setShowCreateModal,
  onCreateMarket,
}: HomeProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("all");

  // Usar el contexto para obtener los datos de mercados
  const { markets, loading, createMarket: createMarketOriginal } = useMarkets();

  // Adapter function to convert between interfaces
  const createMarket = async (
    priceFeed: string,
    assetName: string,
    baseAsset: string,
    targetPrice: string,
    resolutionTime: number
  ): Promise<string | null> => {
    return await createMarketOriginal({
      priceFeed,
      assetName,
      baseAsset,
      targetPrice: ethers.BigNumber.from(targetPrice),
      resolutionTime,
    });
  };

  // Pre-cargar los feeds de Chainlink para que estén disponibles cuando se abra el modal
  const popularFeeds = usePopularFeedsFromContext();
  const allFeeds = useAllFeedsFromContext();

  // Log para debug - puedes ver esto en la consola del navegador
  useEffect(() => {
    if (popularFeeds.feeds.length > 0) {
      console.log(
        "📊 Popular Chainlink feeds loaded:",
        popularFeeds.feeds.length
      );
    }
    if (allFeeds.feeds.length > 0) {
      console.log("📈 All Chainlink feeds loaded:", allFeeds.feeds.length);
    }
  }, [popularFeeds.feeds.length, allFeeds.feeds.length]);

  // Get contract addresses from addresses.json
  const contractAddresses = addresses?.contracts || null;

  // Filter markets based on search and filter - optimized with useMemo
  const filteredMarkets = useMemo(() => {
    console.log("MARKETS", markets);
    return markets.filter((market) => {
      // Filter out empty markets (no bets) that have passed resolution time
      const totalBets =
        parseFloat(market.totalHigherBets) + parseFloat(market.totalLowerBets);
      const isExpired = market.resolutionTime * 1000 <= Date.now();

      console.log("MARKET", market);
      // Hide markets with no bets that have expired (can't be resolved or bet on)
      if (totalBets === 0 && isExpired) {
        return false;
      }

      if (filter === "active") {
        return !market.isResolved && market.resolutionTime * 1000 > Date.now();
      }

      if (filter === "resolved") {
        return market.isResolved;
      }

      return true;
    });
  }, [markets, searchTerm, filter]);

  console.log("filteredMarkets", filteredMarkets);

  return (
    <>
      <Head>
        <title>Prediction Markets - Decentralized Betting Platform</title>
        <meta
          name="description"
          content="Decentralized prediction markets powered by Chainlink"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-80 bg-palette-bg-light dark:bg-palette-bg-dark transition-colors duration-300">
        <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
          {/* Hero Section */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-palette-primary-light dark:text-palette-primary-dark mb-4">
              Decentralized Prediction Markets
            </h1>
            <p className="text-base sm:text-xl text-palette-text-light dark:text-palette-text-dark max-w-3xl mx-auto">
              Bet on real-world events with transparent, automated resolution
              powered by Chainlink oracles. Decentralized, secure, and fully
              verifiable on-chain.
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 max-w-3xl mx-auto">
            {/* Create Market Card */}
            <div
              className="relative group cursor-pointer h-24"
              onClick={onCreateMarket}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-transparent transition-all duration-300 h-full">
                <div className="flex items-center h-full">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                      <MemoizedPlusCircle size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Create Market
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Launch your prediction market
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Claim NOS Card */}
            <div className="relative group h-24">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-transparent transition-all duration-300 h-full">
                <div className="flex items-center justify-between h-full">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                      <MemoizedGift size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Claim NOS
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Get free tokens every 24h
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <ClaimNosButton />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <GlobalStats markets={markets} loading={loading} />

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <MemoizedSearch
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search markets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>

            <div className="flex items-center space-x-2">
              <MemoizedFilter size={20} className="text-gray-400" />
              <select
                value={filter}
                onChange={(e) =>
                  setFilter(e.target.value as "all" | "active" | "resolved")
                }
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
                  <div className="h-4 bg-palette-card-light dark:bg-palette-card-dark rounded mb-4"></div>
                  <div className="h-4 bg-palette-card-light dark:bg-palette-card-dark rounded mb-2"></div>
                  <div className="h-4 bg-palette-card-light dark:bg-palette-card-dark rounded mb-4 w-2/3"></div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="h-16 bg-palette-card-light dark:bg-palette-card-dark rounded"></div>
                    <div className="h-16 bg-palette-card-light dark:bg-palette-card-dark rounded"></div>
                  </div>
                  <div className="h-10 bg-palette-card-light dark:bg-palette-card-dark rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredMarkets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMarkets.map((market) => (
                <MarketCard
                  key={market.address}
                  market={market}
                  factoryAddress={contractAddresses?.marketFactory || ""}
                  nostronetAddress={contractAddresses?.nostronet || ""}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <MemoizedTrendingUp size={48} className="mx-auto" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {searchTerm || filter !== "all"
                  ? "No markets found"
                  : "No markets yet"}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filter !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Be the first to create a prediction market!"}
              </p>
              {!searchTerm && filter === "all" && (
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
                <strong>Network not supported:</strong> Please connect to
                Ethereum Sepolia testnet.
              </div>
            </div>
          )}
        </main>
      </div>
      {showCreateModal && (
        <CreateMarketModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createMarket}
        />
      )}
    </>
  );
}
