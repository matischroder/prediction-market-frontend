import { FC, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useAccount } from 'wagmi';
import { X, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';

import { Market } from '@/types/contracts';
import { formatAmount, formatPercentage } from '@/utils/formatters';
import { useMarketContract } from '@/hooks/useMarketContract';
import { useTokenApproval } from '@/hooks/useTokenApproval';

interface BetModalProps {
  market: Market;
  onClose: () => void;
  factoryAddress: string;
  usdcAddress: string;
}

export const BetModal: FC<BetModalProps> = ({ 
  market, 
  onClose, 
  factoryAddress, 
  usdcAddress 
}) => {
  const { address } = useAccount();
  const [betPosition, setBetPosition] = useState<boolean>(true); // true = YES, false = NO
  const [betAmount, setBetAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [userBalance, setUserBalance] = useState('0');
  const [allowance, setAllowance] = useState(ethers.BigNumber.from(0));

  const { placeBet, getMarketOdds } = useMarketContract(factoryAddress);
  const { checkAllowance, approve, getBalance, isApproving } = useTokenApproval(usdcAddress);

  const betAmountBN = betAmount ? ethers.utils.parseUnits(betAmount, 6) : ethers.BigNumber.from(0);
  const needsApproval = allowance.lt(betAmountBN);

  useEffect(() => {
    const fetchData = async () => {
      if (!address) return;

      try {
        const balance = await getBalance(address);
        setUserBalance(ethers.utils.formatUnits(balance, 6));

        const currentAllowance = await checkAllowance(market.address, address);
        setAllowance(currentAllowance);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchData();
  }, [address, getBalance, checkAllowance, market.address]);

  const handleApprove = async () => {
    if (!address) return;

    try {
      const success = await approve(market.address, ethers.constants.MaxUint256);
      if (success) {
        toast.success('USDC approved successfully!');
        setAllowance(ethers.constants.MaxUint256);
      } else {
        toast.error('Failed to approve USDC');
      }
    } catch (error) {
      console.error('Approval error:', error);
      toast.error('Approval failed');
    }
  };

  const handlePlaceBet = async () => {
    if (!address || !betAmount) return;

    const amount = parseFloat(betAmount);
    if (amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount > parseFloat(userBalance)) {
      toast.error('Insufficient USDC balance');
      return;
    }

    setLoading(true);
    try {
      const success = await placeBet(market.address, betPosition, betAmountBN);
      if (success) {
        toast.success(`${betPosition ? 'YES' : 'NO'} bet placed successfully!`);
        onClose();
      } else {
        toast.error('Failed to place bet');
      }
    } catch (error) {
      console.error('Bet placement error:', error);
      toast.error('Bet placement failed');
    } finally {
      setLoading(false);
    }
  };

  const totalPool = parseFloat(market.totalYesBets) + parseFloat(market.totalNoBets);
  const currentYesOdds = totalPool > 0 ? (parseFloat(market.totalNoBets) / totalPool) * 100 : 50;
  const currentNoOdds = totalPool > 0 ? (parseFloat(market.totalYesBets) / totalPool) * 100 : 50;

  // Calculate potential payout
  const potentialPayout = betAmount ? (
    betPosition 
      ? (parseFloat(betAmount) * (totalPool + parseFloat(betAmount))) / (parseFloat(market.totalYesBets) + parseFloat(betAmount))
      : (parseFloat(betAmount) * (totalPool + parseFloat(betAmount))) / (parseFloat(market.totalNoBets) + parseFloat(betAmount))
  ) : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Place Your Bet</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-2">{market.question}</h3>
          <div className="flex items-center text-sm text-gray-600">
            <Wallet size={16} className="mr-2" />
            <span>Balance: {formatAmount(userBalance, 0)} USDC</span>
          </div>
        </div>

        {/* Position Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Choose Position
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setBetPosition(true)}
              className={`p-4 rounded-lg border-2 transition-colors ${
                betPosition
                  ? 'border-success-500 bg-success-50 text-success-700'
                  : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-success-300'
              }`}
            >
              <div className="flex items-center justify-center mb-2">
                <TrendingUp size={20} />
              </div>
              <div className="font-medium">YES</div>
              <div className="text-sm opacity-75">
                {formatPercentage(currentYesOdds * 100)}
              </div>
            </button>

            <button
              onClick={() => setBetPosition(false)}
              className={`p-4 rounded-lg border-2 transition-colors ${
                !betPosition
                  ? 'border-danger-500 bg-danger-50 text-danger-700'
                  : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-danger-300'
              }`}
            >
              <div className="flex items-center justify-center mb-2">
                <TrendingDown size={20} />
              </div>
              <div className="font-medium">NO</div>
              <div className="text-sm opacity-75">
                {formatPercentage(currentNoOdds * 100)}
              </div>
            </button>
          </div>
        </div>

        {/* Amount Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bet Amount (USDC)
          </label>
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            className="input"
            placeholder="0.00"
            min="0"
            step="0.01"
            max={userBalance}
          />
          <div className="flex justify-between mt-2">
            <div className="flex space-x-2">
              {['10', '50', '100'].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setBetAmount(amount)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                  disabled={parseFloat(amount) > parseFloat(userBalance)}
                >
                  {amount}
                </button>
              ))}
              <button
                onClick={() => setBetAmount(userBalance)}
                className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
              >
                Max
              </button>
            </div>
          </div>
        </div>

        {/* Potential Payout */}
        {betAmount && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-700">
              <div className="flex justify-between">
                <span>Your bet:</span>
                <span>{betAmount} USDC</span>
              </div>
              <div className="flex justify-between">
                <span>Potential payout:</span>
                <span>~{potentialPayout.toFixed(2)} USDC</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Potential profit:</span>
                <span className="text-success-600">
                  +{(potentialPayout - parseFloat(betAmount)).toFixed(2)} USDC
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {needsApproval && betAmount && (
            <button
              onClick={handleApprove}
              disabled={isApproving}
              className="btn btn-secondary w-full"
            >
              {isApproving ? 'Approving...' : 'Approve USDC'}
            </button>
          )}

          <button
            onClick={handlePlaceBet}
            disabled={
              loading || 
              !betAmount || 
              parseFloat(betAmount) <= 0 || 
              parseFloat(betAmount) > parseFloat(userBalance) ||
              needsApproval
            }
            className={`btn w-full ${
              betPosition ? 'btn-success' : 'btn-danger'
            }`}
          >
            {loading 
              ? 'Placing Bet...' 
              : `Place ${betPosition ? 'YES' : 'NO'} Bet`
            }
          </button>
        </div>
      </div>
    </div>
  );
};
