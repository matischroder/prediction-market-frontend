import { FC } from "react";
import { Bot, Zap, CheckCircle, Clock, DollarSign, Gift } from "lucide-react";

interface AutomationStatusProps {
  totalMarkets: number;
  automatedMarkets: number;
  activeAutomations: number;
  resolvedWithVRF: number;
}

export const AutomationStatus: FC<AutomationStatusProps> = ({
  totalMarkets,
  automatedMarkets,
  activeAutomations,
  resolvedWithVRF,
}) => {
  const automationRate =
    totalMarkets > 0 ? (automatedMarkets / totalMarkets) * 100 : 0;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800 mb-6">
      <div className="flex items-center mb-4">
        <Bot className="text-blue-600 dark:text-blue-400 mr-2" size={24} />
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Chainlink Automation Status
        </h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Bot className="text-blue-600 dark:text-blue-400" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {automatedMarkets}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Automated Markets
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            {automationRate.toFixed(1)}% of total
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <CheckCircle
              className="text-green-600 dark:text-green-400"
              size={20}
            />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {activeAutomations}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Active Automations
          </div>
          <div className="text-xs text-green-600 dark:text-green-400 mt-1">
            Registered & Running
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Zap className="text-purple-600 dark:text-purple-400" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {resolvedWithVRF}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            VRF Resolutions
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
            Random winners selected
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Gift className="text-orange-600 dark:text-orange-400" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {resolvedWithVRF}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Bonus Rewards
          </div>
          <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
            Random bonuses paid
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Clock size={14} className="mr-2" />
          <span>
            All new markets are automatically funded and registered with
            Chainlink Automation for seamless resolution.
          </span>
        </div>
      </div>
    </div>
  );
};
