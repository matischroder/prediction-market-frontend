import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useNetwork, useAccount } from "wagmi";
import Head from "next/head";
import Link from "next/link";
import { ethers } from "ethers";
import {
  ArrowLeft,
  Calendar,
  Users,
  TrendingUp,
  Award,
  ExternalLink,
  Bot,
  CheckCircle,
  Zap,
  Gift,
  Clock,
} from "lucide-react";

import { Market } from "@/types/contracts";
import { BetModal } from "@/components/BetModal";
import { CreateMarketModal } from "@/components/CreateMarketModal";
import { useMarkets } from "@/context/MarketContext";
import {
  useMarketOdds,
  useUserBets,
  useClaimPrize,
} from "@/hooks/useMarketQueries";
import {
  formatAmount,
  formatDate,
  calculateTimeLeft,
  formatPercentage,
  formatAddress,
} from "@/utils/formatters";

function getEnvAddress(key: string) {
  if (typeof window !== "undefined") {
    return process.env[key] || (window as any)[key] || "";
  }
  return process.env[key] || "";
}

interface MarketDetailProps {
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;
}

export default function MarketDetail({
  showCreateModal,
  setShowCreateModal,
}: MarketDetailProps) {
  const router = useRouter();
  const { id } = router.query;
  const { chain } = useNetwork();
  const { address } = useAccount();

  const [market, setMarket] = useState<Market | null>(null);
  const [showBetModal, setShowBetModal] = useState(false);
  const [localUserBets, setLocalUserBets] = useState({
    higherBet: "0",
    lowerBet: "0",
    hasClaimed: false,
    betIndices: [] as number[],
    // Backward compatibility
    yesBet: "0",
    noBet: "0",
  });
  const [localOdds, setLocalOdds] = useState({
    higherOdds: 2.0,
    lowerOdds: 2.0,
    yesOdds: 2.0,
    noOdds: 2.0,
  });

  // Usar el contexto para obtener los datos
  const { markets, createMarket } = useMarkets();

  // Use TanStack Query hooks for specific market data
  const { data: oddsData } = useMarketOdds(market?.address || "");
  const { data: userBetsData } = useUserBets(market?.address || "");
  const claimPrizeMutation = useClaimPrize();

  const chainName = chain?.name?.toLowerCase().includes("mumbai")
    ? "mumbai"
    : chain?.name?.toLowerCase().includes("sepolia")
    ? "sepolia"
    : "mumbai";

  // Get contract addresses from env
  const contractAddresses = {
    marketFactory: process.env.NEXT_PUBLIC_MARKET_FACTORY_ADDRESS || "",
    usdc: process.env.NEXT_PUBLIC_USDC_ADDRESS || "",
    proofOfReserves: process.env.NEXT_PUBLIC_PROOF_OF_RESERVES_ADDRESS || "",
    ccipBridge: process.env.NEXT_PUBLIC_CCIP_BRIDGE_ADDRESS || "",
    chainlinkFunctions:
      process.env.NEXT_PUBLIC_CHAINLINK_FUNCTIONS_ADDRESS || "",
  };

  useEffect(() => {
    if (id && markets.length > 0) {
      const foundMarket = markets.find(
        (m) => m.address.toLowerCase() === (id as string).toLowerCase()
      );
      if (foundMarket) {
        setMarket(foundMarket);
      }
    }
  }, [id, markets]);

  // Update local state when TanStack Query data changes
  useEffect(() => {
    if (oddsData) {
      setLocalOdds({
        higherOdds: oddsData.higherOdds,
        lowerOdds: oddsData.lowerOdds,
        yesOdds: oddsData.yesOdds || oddsData.higherOdds,
        noOdds: oddsData.noOdds || oddsData.lowerOdds,
      });
    }
  }, [oddsData]);

  useEffect(() => {
    if (userBetsData) {
      setLocalUserBets({
        higherBet: userBetsData.higherBet,
        lowerBet: userBetsData.lowerBet,
        hasClaimed: userBetsData.hasClaimed,
        betIndices: userBetsData.betIndices,
        yesBet: userBetsData.yesBet || userBetsData.higherBet,
        noBet: userBetsData.noBet || userBetsData.lowerBet,
      });
    }
  }, [userBetsData]);

  if (!market) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading market...</p>
          </div>
        </div>
      </div>
    );
  }

  const totalPool =
    parseFloat(market.totalHigherBets) + parseFloat(market.totalLowerBets);
  const hasEnded = market.resolutionTime * 1000 < Date.now();
  const timeLeft = calculateTimeLeft(market.resolutionTime);
  const hasUserBets =
    parseFloat(localUserBets.higherBet) > 0 ||
    parseFloat(localUserBets.lowerBet) > 0;
  const userTotalBet =
    parseFloat(localUserBets.higherBet) + parseFloat(localUserBets.lowerBet);

  return (
    <>
      <Head>
        <title>{market.question} - Prediction Market</title>
        <meta name="description" content={`Bet on: ${market.question}`} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center text-primary-600 hover:text-primary-700"
            >
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
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  hasEnded
                    ? market.isResolved
                      ? "bg-gray-100 text-gray-700"
                      : "bg-orange-100 text-orange-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {hasEnded
                  ? market.isResolved
                    ? "Resolved"
                    : "Pending Resolution"
                  : "Active"}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="flex items-center text-gray-600">
                <Calendar size={20} className="mr-3" />
                <div>
                  <div className="text-sm text-gray-500">Resolution Time</div>
                  <div className="font-medium">
                    {hasEnded
                      ? `Ended ${formatDate(market.resolutionTime)}`
                      : timeLeft}
                  </div>
                </div>
              </div>

              <div className="flex items-center text-gray-600">
                <Users size={20} className="mr-3" />
                <div>
                  <div className="text-sm text-gray-500">Total Pool</div>
                  <div className="font-medium">
                    {formatAmount(totalPool.toString(), 6)} USDC
                  </div>
                </div>
              </div>

              <div className="flex items-center text-gray-600">
                <ExternalLink size={20} className="mr-3" />
                <div>
                  <div className="text-sm text-gray-500">Contract</div>
                  <div className="font-medium">
                    {formatAddress(market.address)}
                  </div>
                </div>
              </div>
            </div>

            {/* Automation Status */}
            {market.isAutomated && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center mb-3">
                  <Bot size={20} className="text-blue-600 mr-2" />
                  <span className="font-medium text-blue-900">
                    Chainlink Automation
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center">
                    <CheckCircle
                      size={16}
                      className={`mr-2 ${
                        market.automationRegistered
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    />
                    <span
                      className={
                        market.automationRegistered
                          ? "text-green-700"
                          : "text-gray-600"
                      }
                    >
                      Automation:{" "}
                      {market.automationRegistered ? "Registered" : "Pending"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Zap
                      size={16}
                      className={`mr-2 ${
                        market.vrfFulfilled
                          ? "text-purple-600"
                          : market.vrfRequested
                          ? "text-yellow-600"
                          : "text-gray-400"
                      }`}
                    />
                    <span
                      className={
                        market.vrfFulfilled
                          ? "text-purple-700"
                          : market.vrfRequested
                          ? "text-yellow-700"
                          : "text-gray-600"
                      }
                    >
                      VRF:{" "}
                      {market.vrfFulfilled
                        ? "Complete"
                        : market.vrfRequested
                        ? "Requested"
                        : "Pending"}
                    </span>
                  </div>
                  {market.isResolved && market.randomWinner && (
                    <div className="flex items-center">
                      <Gift size={16} className="text-orange-600 mr-2" />
                      <span className="text-orange-700">
                        Bonus Winner: {market.randomWinner.slice(0, 8)}...
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-2 text-xs text-blue-600 flex items-center">
                  <Clock size={12} className="mr-1" />
                  This market resolves automatically at expiry using Chainlink
                  Automation and VRF
                </div>
              </div>
            )}

            {hasUserBets && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center mb-2">
                  <TrendingUp size={20} className="text-blue-600 mr-2" />
                  <span className="font-medium text-blue-900">
                    Your Position
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">YES Bet: </span>
                    <span className="font-medium">
                      {formatAmount(localUserBets.yesBet, 6)} USDC
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">NO Bet: </span>
                    <span className="font-medium">
                      {formatAmount(localUserBets.noBet, 6)} USDC
                    </span>
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
              <div
                className={`p-4 rounded-lg border mb-6 ${
                  market.outcome
                    ? "bg-success-50 border-success-200"
                    : "bg-danger-50 border-danger-200"
                }`}
              >
                <div className="flex items-center">
                  <Award
                    size={20}
                    className={`mr-2 ${
                      market.outcome ? "text-success-600" : "text-danger-600"
                    }`}
                  />
                  <span
                    className={`font-medium text-lg ${
                      market.outcome ? "text-success-800" : "text-danger-800"
                    }`}
                  >
                    Market Resolved: {market.outcome ? "YES" : "NO"} wins!
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
                    <span className="text-lg font-semibold text-success-700">
                      YES
                    </span>
                    <span className="text-2xl font-bold text-success-800">
                      {formatPercentage(localOdds.yesOdds)}
                    </span>
                  </div>
                  <div className="text-sm text-success-600">
                    {formatAmount(
                      market.totalYesBets || market.totalHigherBets,
                      6
                    )}{" "}
                    USDC backed
                  </div>
                  <div className="mt-2 bg-success-100 rounded-full h-2">
                    <div
                      className="bg-success-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${localOdds.yesOdds / 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-semibold text-danger-700">
                      NO
                    </span>
                    <span className="text-2xl font-bold text-danger-800">
                      {formatPercentage(localOdds.noOdds)}
                    </span>
                  </div>
                  <div className="text-sm text-danger-600">
                    {formatAmount(
                      market.totalNoBets || market.totalLowerBets,
                      6
                    )}{" "}
                    USDC backed
                  </div>
                  <div className="mt-2 bg-danger-100 rounded-full h-2">
                    <div
                      className="bg-danger-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${localOdds.noOdds / 100}%` }}
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

                {market.isResolved &&
                  hasUserBets &&
                  !localUserBets.hasClaimed && (
                    <button
                      onClick={() =>
                        claimPrizeMutation.mutate({
                          marketAddress: market.address,
                        })
                      }
                      disabled={claimPrizeMutation.isPending}
                      className="btn btn-success w-full"
                    >
                      {claimPrizeMutation.isPending
                        ? "Claiming..."
                        : "Claim Prize"}
                    </button>
                  )}

                {localUserBets.hasClaimed && (
                  <div className="text-center text-success-600 font-medium">
                    ✅ Prize Claimed
                  </div>
                )}

                {(!hasUserBets || localUserBets.hasClaimed) && hasEnded && (
                  <div className="text-center text-gray-500">
                    {market.isResolved
                      ? "Market has ended"
                      : "Awaiting resolution"}
                  </div>
                )}
              </div>

              {/* Market Info */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="font-medium text-gray-900 mb-4">
                  Market Details
                </h3>
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
            factoryAddress={contractAddresses?.marketFactory || ""}
            usdcAddress={contractAddresses?.usdc || ""}
          />
        )}
        {showCreateModal && (
          <CreateMarketModal
            onClose={() => setShowCreateModal(false)}
            onCreate={async (
              priceFeed: string,
              assetName: string,
              baseAsset: string,
              targetPrice: string,
              resolutionTime: number
            ) => {
              // Adaptar los parámetros al formato esperado por createMarket
              const marketParams = {
                priceFeed,
                assetName,
                baseAsset,
                targetPrice: ethers.utils.parseUnits(targetPrice, 8), // Convertir a BigNumber con 8 decimales
                resolutionTime,
              };
              return await createMarket(marketParams);
            }}
          />
        )}
      </div>
    </>
  );
}
