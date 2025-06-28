import { useState, useEffect, useMemo } from "react";
import { useNetwork } from "wagmi";
import Head from "next/head";
import { ethers } from "ethers";
import { MarketCard } from "@/components/MarketCard";
import { Search, Filter, TrendingUp, Users, DollarSign } from "lucide-react";
import { CreateMarketModal } from "@/components/CreateMarketModal";
import { useMarkets } from "@/context/MarketContext";
import { formatAmount } from "@/utils/formatters";
import {
  usePopularFeedsFromContext,
  useAllFeedsFromContext,
} from "@/context/ChainlinkFeedsContext";

interface HomeProps {
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;
}

export default function Home({
  showCreateModal,
  setShowCreateModal,
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

  // Get contract addresses from env
  const contractAddresses = {
    marketFactory: process.env.NEXT_PUBLIC_MARKET_FACTORY_ADDRESS || "",
    usdc: process.env.NEXT_PUBLIC_USDC_ADDRESS || "",
    proofOfReserves: process.env.NEXT_PUBLIC_PROOF_OF_RESERVES_ADDRESS || "",
    ccipBridge: process.env.NEXT_PUBLIC_CCIP_BRIDGE_ADDRESS || "",
    chainlinkFunctions:
      process.env.NEXT_PUBLIC_CHAINLINK_FUNCTIONS_ADDRESS || "",
  };

  // Filter markets based on search and filter - optimized with useMemo
  const filteredMarkets = useMemo(() => {
    console.log("MARKETS", markets);
    return markets.filter((market) => {
      if (filter === "active") {
        return !market.isResolved && market.resolutionTime * 1000 > Date.now();
      }

      if (filter === "resolved") {
        return market.isResolved;
      }

      return true;
    });
  }, [markets, searchTerm, filter]);

  // Calculate stats - optimized with useMemo
  const { totalMarkets, activeMarkets, totalVolume } = useMemo(() => {
    const total = markets.length;
    const active = markets.filter(
      (m) => !m.isResolved && m.resolutionTime * 1000 > Date.now()
    ).length;
    const volume = markets.reduce((sum, market) => {
      return (
        sum +
        parseFloat(market.totalHigherBets) +
        parseFloat(market.totalLowerBets)
      );
    }, 0);

    return {
      totalMarkets: total,
      activeMarkets: active,
      totalVolume: volume,
    };
  }, [markets]);

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
              powered by Chainlink oracles. Cross-chain compatible with
              verifiable randomness and proof of reserves.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="card text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp
                  className="text-palette-primary-light dark:text-palette-primary-dark"
                  size={24}
                />
              </div>
              <div className="text-2xl font-bold text-palette-text-light dark:text-palette-text-dark">
                {totalMarkets}
              </div>
              <div className="text-sm text-palette-text-light dark:text-palette-text-dark">
                Total Markets
              </div>
            </div>

            <div className="card text-center">
              <div className="flex items-center justify-center mb-2">
                <Users
                  className="text-success-600 dark:text-success-500"
                  size={24}
                />
              </div>
              <div className="text-2xl font-bold text-palette-text-light dark:text-palette-text-dark">
                {activeMarkets}
              </div>
              <div className="text-sm text-palette-text-light dark:text-palette-text-dark">
                Active Markets
              </div>
            </div>

            <div className="card text-center">
              <div className="flex items-center justify-center mb-2">
                <DollarSign
                  className="text-palette-primary-light dark:text-palette-primary-dark"
                  size={24}
                />
              </div>
              <div className="text-2xl font-bold text-palette-text-light dark:text-palette-text-dark">
                {totalVolume > 1000000000
                  ? (totalVolume / 1000000000).toFixed(2) + "K"
                  : (totalVolume / 1000000).toFixed(0)}
              </div>
              <div className="text-sm text-palette-text-light dark:text-palette-text-dark">
                Volume
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search
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
              <Filter size={20} className="text-gray-400" />
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
                  usdcAddress={contractAddresses?.usdc || ""}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <TrendingUp size={48} className="mx-auto" />
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
