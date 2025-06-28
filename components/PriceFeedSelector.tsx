import React from "react";
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import {
  ChainlinkFeed,
  formatFeedName,
  getFeedDescription,
} from "../utils/chainlinkFeeds";

interface PriceFeedSelectorProps {
  feeds: ChainlinkFeed[];
  selectedFeed: ChainlinkFeed | null;
  onFeedSelect: (feed: ChainlinkFeed) => void;
  isLoading?: boolean;
  className?: string;
  placeholder?: string;
}

export const PriceFeedSelector: React.FC<PriceFeedSelectorProps> = ({
  feeds,
  selectedFeed,
  onFeedSelect,
  isLoading = false,
  className = "",
  placeholder = "Select a price feed...",
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredFeeds = React.useMemo(() => {
    if (!searchTerm) return feeds;

    return feeds.filter((feed) => {
      const feedName = formatFeedName(feed).toLowerCase();
      const assetName = feed.assetName.toLowerCase();
      const search = searchTerm.toLowerCase();

      return feedName.includes(search) || assetName.includes(search);
    });
  }, [feeds, searchTerm]);

  const handleFeedSelect = (feed: ChainlinkFeed) => {
    onFeedSelect(feed);
    setIsOpen(false);
    setSearchTerm("");
  };

  if (isLoading) {
    return (
      <div
        className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg ${className}`}
      >
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <span className="text-gray-500 dark:text-gray-400">
            Loading price feeds...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-left text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
      >
        <div className="flex-1 min-w-0">
          {selectedFeed ? (
            <div>
              <div className="font-medium">{formatFeedName(selectedFeed)}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {selectedFeed.assetName}
              </div>
            </div>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">
              {placeholder}
            </span>
          )}
        </div>
        <ChevronDownIcon
          className={`w-5 h-5 text-gray-400 ml-2 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-80 overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search price feeds..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Feed List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredFeeds.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                {searchTerm
                  ? "No price feeds found"
                  : "No price feeds available"}
              </div>
            ) : (
              filteredFeeds.map((feed, index) => (
                <button
                  key={`${feed.contractAddress}-${index}`}
                  onClick={() => handleFeedSelect(feed)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 ${
                    selectedFeed?.contractAddress === feed.contractAddress
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      : "text-gray-900 dark:text-white"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{formatFeedName(feed)}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {getFeedDescription(feed)}
                    </div>
                  </div>

                  {/* Feed Category Badge */}
                  <div
                    className={`ml-2 px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                      feed.feedCategory === "verified"
                        ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                        : "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                    }`}
                  >
                    {feed.feedCategory}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
