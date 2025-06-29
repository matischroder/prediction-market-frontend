import { FC } from "react";
import { TrendingUp, Users, DollarSign, Clock } from "lucide-react";
import { Market } from "@/types/contracts";
import { formatAmount } from "@/utils/formatters";

interface GlobalStatsProps {
  markets: Market[];
  loading: boolean;
}

export const GlobalStats: FC<GlobalStatsProps> = ({ markets, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const totalPool = markets.reduce((sum, market) => {
    return (
      sum +
      parseFloat(market.totalHigherBets) +
      parseFloat(market.totalLowerBets)
    );
  }, 0);

  const activeMarkets = markets.filter(
    (market) => !market.isResolved && market.resolutionTime * 1000 > Date.now()
  );
  const resolvedMarkets = markets.filter((market) => market.isResolved);
  const totalMarkets = markets.filter((market) => {
    const totalPool =
      parseFloat(market.totalHigherBets) + parseFloat(market.totalLowerBets);
    return totalPool > 0 && market.resolutionTime * 1000 < Date.now();
  }).length;

  const stats = [
    {
      icon: TrendingUp,
      label: "Active Markets",
      value: activeMarkets.length.toString(),
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-900/20",
    },
    {
      icon: Users,
      label: "Total Markets",
      value: totalMarkets.toString(),
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      icon: DollarSign,
      label: "Total Pool",
      value: `$${formatAmount(totalPool.toString(), 6)}`,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      icon: Clock,
      label: "Resolved",
      value: resolvedMarkets.length.toString(),
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-900/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className={`card p-4 ${stat.bg} border-0`}>
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.label}
                </p>
                <p className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
