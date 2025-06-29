import { FC, useState, useEffect } from "react";
import {
  X,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  HelpCircle,
  Bot,
  Zap,
  Clock,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNetwork } from "wagmi";
import { PriceFeedSelector } from "./PriceFeedSelector";
import { useSimpleFeedPrice } from "../hooks/useFeedPrice";
import {
  usePopularFeedsFromContext,
  useAllFeedsFromContext,
} from "../context/ChainlinkFeedsContext";
import { ChainlinkFeed, formatFeedName } from "../utils/chainlinkFeeds";

interface CreateMarketModalProps {
  onClose: () => void;
  onCreate: (
    priceFeed: string,
    assetName: string,
    baseAsset: string,
    targetPrice: string,
    resolutionTime: number
  ) => Promise<string | null>;
}

export const CreateMarketModal: FC<CreateMarketModalProps> = ({
  onClose,
  onCreate,
}) => {
  const { chain } = useNetwork();
  const [selectedFeed, setSelectedFeed] = useState<ChainlinkFeed | null>(null);
  const [showAllFeeds, setShowAllFeeds] = useState(false);
  const [resolutionDate, setResolutionDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingDots, setLoadingDots] = useState(0);
  const [targetPrice, setTargetPrice] = useState("");

  const popularFeeds = usePopularFeedsFromContext();
  const allFeeds = useAllFeedsFromContext();

  const currentFeeds = showAllFeeds ? allFeeds.feeds : popularFeeds.feeds;

  // Get current price from selected feed
  const feedPrice = useSimpleFeedPrice(
    selectedFeed
      ? selectedFeed.proxyAddress || selectedFeed.contractAddress
      : ""
  );

  // Animate loading dots: Creating -> Creating. -> Creating.. -> Creating...
  useEffect(() => {
    if (!loading) {
      setLoadingDots(0);
      return;
    }

    const interval = setInterval(() => {
      setLoadingDots((prev) => {
        if (prev === 0) return 1;
        if (prev === 1) return 2;
        if (prev === 2) return 3;
        return 0;
      });
    }, 500); // Change every 500ms

    return () => clearInterval(interval);
  }, [loading]);

  // Generate question automatically based on selected feed and target price
  const generateQuestion = () => {
    if (!selectedFeed || !targetPrice)
      return "Select a price feed and target price";

    const assetName = selectedFeed.pair[0];
    const baseAsset = selectedFeed.pair[1] || "USD";

    const resolutionDateFormatted = resolutionDate
      ? new Date(resolutionDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "[date]";

    return `${assetName}/${baseAsset} Above $${targetPrice} by ${resolutionDateFormatted}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFeed || !targetPrice || !resolutionDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const resolutionTimestamp = new Date(resolutionDate).getTime() / 1000;
    if (resolutionTimestamp <= Date.now() / 1000) {
      toast.error("Resolution date must be in the future");
      return;
    }

    if (isNaN(Number(targetPrice)) || Number(targetPrice) <= 0) {
      toast.error("Please enter a valid target price");
      return;
    }

    setLoading(true);
    try {
      // Extract asset names from the feed pair
      const assetName = selectedFeed.pair[0];
      const baseAsset = selectedFeed.pair[1] || "USD";

      // Convert price to Chainlink format (8 decimals)
      const targetPriceFormatted = (Number(targetPrice) * 1e8).toString();

      const feedAddress =
        selectedFeed.proxyAddress || selectedFeed.contractAddress;
      console.log(`🎯 Creating market with feed address: ${feedAddress}`);
      console.log(`   - Feed name: ${selectedFeed.name}`);
      console.log(`   - Proxy address: ${selectedFeed.proxyAddress}`);
      console.log(`   - Contract address: ${selectedFeed.contractAddress}`);
      console.log(`   - Using address: ${feedAddress}`);

      const marketAddress = await onCreate(
        feedAddress,
        assetName,
        baseAsset,
        targetPriceFormatted,
        resolutionTimestamp
      );

      if (marketAddress) {
        toast.success("Market created successfully!");
        onClose();
      }
    } catch (error) {
      console.error("Error creating market:", error);
      toast.error("Failed to create market");
    } finally {
      setLoading(false);
    }
  };

  const minDateTime = new Date(Date.now() + 3600000).toISOString().slice(0, 16);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-palette-card-light dark:bg-palette-card-dark rounded-xl max-w-2xl w-full p-6 max-h-[90vh] my-auto overflow-y-auto text-palette-text-light dark:text-palette-text-dark border border-palette-border-light dark:border-palette-border-dark">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-palette-text-light dark:text-palette-text-dark">
            Create Prediction Market
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Automation Info */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start">
            <div className="flex items-center">
              <Bot
                className="text-blue-600 dark:text-blue-400 mr-2"
                size={20}
              />
              <Zap
                className="text-purple-600 dark:text-purple-400 mr-3"
                size={20}
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Fully Automated Markets
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                Your market will be automatically funded and registered with
                Chainlink Automation for seamless resolution.
              </p>
              <div className="flex flex-wrap gap-3 text-xs">
                <div className="flex items-center text-blue-600 dark:text-blue-400">
                  <Clock size={12} className="mr-1" />
                  Auto-resolution at expiry
                </div>
                <div className="flex items-center text-purple-600 dark:text-purple-400">
                  <Zap size={12} className="mr-1" />
                  VRF random bonus winner
                </div>
                <div className="flex items-center text-green-600 dark:text-green-400">
                  <DollarSign size={12} className="mr-1" />
                  Pre-funded with ETH & LINK
                </div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Price Feed Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-palette-text-light dark:text-palette-text-dark">
                <HelpCircle size={16} className="inline mr-1" />
                Price Feed{" "}
                {chain && (
                  <span className="text-sm text-gray-500">({chain.name})</span>
                )}
              </label>
              <button
                type="button"
                onClick={() => setShowAllFeeds(!showAllFeeds)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              >
                {showAllFeeds ? "Show Popular" : "Show All"}
              </button>
            </div>
            <PriceFeedSelector
              feeds={currentFeeds}
              selectedFeed={selectedFeed}
              onFeedSelect={setSelectedFeed}
              placeholder="Choose a price feed for your market"
            />
            {selectedFeed && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 space-y-1">
                <p>
                  Selected: {formatFeedName(selectedFeed)} ({selectedFeed.name})
                </p>
                <p>
                  Address:{" "}
                  {selectedFeed.proxyAddress || selectedFeed.contractAddress}
                </p>
                <div className="flex items-center space-x-1">
                  <span>Current Price:</span>
                  <div className="flex items-center space-x-1">
                    {feedPrice.isLoading ? (
                      <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-3 w-16 rounded"></div>
                    ) : feedPrice.error ? (
                      <span className="text-red-500 text-xs">
                        Error loading
                      </span>
                    ) : (
                      <>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {feedPrice.formattedPrice}
                        </span>
                        <div
                          className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"
                          title="Live price"
                        ></div>
                      </>
                    )}
                  </div>
                </div>
                {selectedFeed.proxyAddress &&
                  selectedFeed.contractAddress &&
                  selectedFeed.proxyAddress !==
                    selectedFeed.contractAddress && (
                    <p className="text-yellow-600 dark:text-yellow-400">
                      Using proxy: {selectedFeed.proxyAddress}
                    </p>
                  )}
              </div>
            )}
          </div>

          {/* Target Price */}
          <div>
            <label className="block text-sm font-medium text-palette-text-light dark:text-palette-text-dark mb-2">
              <DollarSign size={16} className="inline mr-1" />
              Target Price
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                type="number"
                step="0.01"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="input w-full pl-8"
                placeholder="Enter target price"
                required
              />
            </div>
            {selectedFeed && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Users will predict if {selectedFeed.pair.join("/")} will be{" "}
                <strong>HIGHER</strong> or <strong>LOWER</strong> than this
                price
              </p>
            )}
          </div>

          {/* Resolution Date */}
          <div>
            <label className="block text-sm font-medium text-palette-text-light dark:text-palette-text-dark mb-2">
              <Calendar size={16} className="inline mr-1" />
              Resolution Date & Time
            </label>
            <input
              type="datetime-local"
              value={resolutionDate}
              onChange={(e) => setResolutionDate(e.target.value)}
              className="input w-full dark:[color-scheme:dark]"
              min={minDateTime}
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              When should this market be automatically resolved?
            </p>
          </div>

          {/* Market Preview */}
          {selectedFeed && targetPrice && (
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                Market Preview
              </h4>
              <div className="space-y-2">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Market Question:</strong> {generateQuestion()}
                </p>
                <div className="flex space-x-4 mt-3">
                  <div className="flex items-center space-x-2 bg-green-100 dark:bg-green-900/30 px-3 py-2 rounded-lg">
                    <TrendingUp
                      size={16}
                      className="text-green-600 dark:text-green-400"
                    />
                    <span className="text-sm font-medium text-green-800 dark:text-green-300">
                      HIGHER than ${targetPrice}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 bg-red-100 dark:bg-red-900/30 px-3 py-2 rounded-lg">
                    <TrendingDown
                      size={16}
                      className="text-red-600 dark:text-red-400"
                    />
                    <span className="text-sm font-medium text-red-800 dark:text-red-300">
                      LOWER than ${targetPrice}
                    </span>
                  </div>
                </div>
                <div className="pt-2 space-y-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Price Feed: {selectedFeed.name}{" "}
                    {chain && `on ${chain.name}`}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Current Price:
                    </span>
                    <div className="flex items-center space-x-1">
                      {feedPrice.isLoading ? (
                        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-3 w-16 rounded"></div>
                      ) : feedPrice.error ? (
                        <span className="text-red-500 text-xs">Error</span>
                      ) : (
                        <>
                          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                            {feedPrice.formattedPrice}
                          </span>
                          <div
                            className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"
                            title="Live price"
                          ></div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Market Rules - Only show when no preview is available */}
          {!(selectedFeed && targetPrice) && (
            <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-200 mb-2">
                Market Rules & Fees
              </h4>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>
                  • Markets resolve automatically using Chainlink price feeds
                </li>
                <li>
                  • Winners share the losing pool proportionally to their bet
                  size
                </li>
                <li>• Treasury fee: 2% deducted from total pool</li>
                <li>• Random bonus: 2% awarded to a random participant</li>
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                loading || !selectedFeed || !targetPrice || !resolutionDate
              }
              className="btn btn-primary flex-1"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  Creating
                  <span className="ml-0">
                    <span
                      className={`transition-opacity duration-200 ${
                        loadingDots >= 1 ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      .
                    </span>
                    <span
                      className={`transition-opacity duration-200 ${
                        loadingDots >= 2 ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      .
                    </span>
                    <span
                      className={`transition-opacity duration-200 ${
                        loadingDots >= 3 ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      .
                    </span>
                  </span>
                </span>
              ) : (
                "Create Market"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
