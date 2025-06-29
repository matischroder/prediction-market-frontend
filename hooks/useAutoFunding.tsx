import { useEffect, useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { ethers } from "ethers";
import { toast } from "react-hot-toast";
import MockERC20ABI from "../contracts/abis/MockERC20.json";
import { getContractAddress } from "../utils/contracts";

const AUTO_FUND_AMOUNT = ethers.utils.parseUnits("10", 6); // 10 NOS with 6 decimals
const STORAGE_KEY = "auto-funded-addresses";

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

export function useAutoFunding() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [fundedAddresses, setFundedAddresses] = useState<Set<string>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(false);

  // Create provider when wallet is available
  const provider =
    typeof window !== "undefined" && (window as any).ethereum
      ? new ethers.providers.Web3Provider((window as any).ethereum)
      : undefined;

  // Load funded addresses from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setFundedAddresses(new Set(JSON.parse(stored)));
      }
    } catch (error) {
      console.error("Failed to load funded addresses:", error);
    }
  }, []);

  const addTokenToWallet = async () => {
    if (!window.ethereum) {
      toast.error("MetaMask not detected");
      return;
    }

    try {
      const nostronetAddress = getContractAddress("nostronet");

      await window.ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: nostronetAddress,
            symbol: "NOS",
            decimals: 6,
            image: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
          },
        },
      });

      toast.success("NOS token added to wallet!");
    } catch (error) {
      console.error("Failed to add token to wallet:", error);
      toast.error("Failed to add token to wallet");
    }
  };

  const fundWallet = async () => {
    if (!address || !provider) return;

    try {
      setIsLoading(true);
      const nostronetAddress = getContractAddress("nostronet");
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        nostronetAddress,
        MockERC20ABI,
        signer
      );

      toast.loading("Sending test NOS to your wallet...", { id: "auto-fund" });

      const tx = await contract.mint(address, AUTO_FUND_AMOUNT);
      await tx.wait();

      // Mark as funded
      const newFundedAddresses = new Set(fundedAddresses);
      newFundedAddresses.add(address.toLowerCase());
      setFundedAddresses(newFundedAddresses);

      // Save to localStorage
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(Array.from(newFundedAddresses))
        );
      } catch (error) {
        console.error("Failed to save funded addresses:", error);
      }

      // Show success toast with action button
      toast.custom(
        (t) => (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 shadow-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🎉</span>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <div className="text-sm font-medium text-green-800 dark:text-green-200">
                  Welcome! You've received 10 NOS test tokens
                </div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Ready to start predicting market outcomes!
                </div>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={() => {
                    addTokenToWallet();
                    toast.dismiss(t.id);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                >
                  Add to Wallet
                </button>
              </div>
            </div>
          </div>
        ),
        {
          duration: 8000,
          id: "auto-fund",
          position: "top-center",
        }
      );

      // Show add to wallet button toast after 2 seconds
      setTimeout(() => {
        toast.custom(
          (t) => (
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-lg">
              <div className="flex flex-col gap-2">
                <span className="text-gray-800">
                  Add NOS token to your wallet?
                </span>
                <button
                  onClick={() => {
                    addTokenToWallet();
                    toast.dismiss(t.id);
                  }}
                  className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
                >
                  Add NOS to Wallet
                </button>
              </div>
            </div>
          ),
          { duration: 8000 }
        );
      }, 2000);
    } catch (error) {
      console.error("Failed to auto-fund wallet:", error);
      toast.error("Failed to send test NOS", { id: "auto-fund" });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fund when wallet connects (if not already funded)
  useEffect(() => {
    if (
      isConnected &&
      address &&
      provider &&
      !fundedAddresses.has(address.toLowerCase()) &&
      !isLoading
    ) {
      // Add small delay to ensure wallet is fully connected
      setTimeout(() => {
        fundWallet();
      }, 1000);
    }
  }, [isConnected, address, provider, fundedAddresses, isLoading]);

  const manualFund = () => {
    if (address && !fundedAddresses.has(address.toLowerCase())) {
      fundWallet();
    } else {
      toast.error("Wallet already funded or not connected");
    }
  };

  return {
    isAutoFunding: isLoading,
    manualFund,
    addTokenToWallet,
    isFunded: address ? fundedAddresses.has(address.toLowerCase()) : false,
  };
}
