import { useState, useCallback, useMemo } from "react";
import { ethers } from "ethers";
import { useWalletClient } from "wagmi";
import { getCachedSigner } from "@/utils/providerCache";

const ERC20_ABI = [
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

export function useTokenApproval(tokenAddress: string) {
  console.log("TOKEN ADDRESS", tokenAddress);
  const { data: walletClient } = useWalletClient();
  const [isApproving, setIsApproving] = useState(false);

  const signer = useMemo(() => {
    return getCachedSigner(walletClient);
  }, [walletClient]);

  const checkAllowance = useCallback(
    async (spender: string, owner: string): Promise<ethers.BigNumber> => {
      if (!signer) return ethers.BigNumber.from(0);

      const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      return await token.allowance(owner, spender);
    },
    [signer, tokenAddress]
  );

  const approve = useCallback(
    async (spender: string, amount: ethers.BigNumber): Promise<boolean> => {
      if (!signer) return false;

      setIsApproving(true);
      try {
        const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
        const tx = await token.approve(spender, amount);
        await tx.wait();
        return true;
      } catch (error) {
        console.error("Approval error:", error);
        return false;
      } finally {
        setIsApproving(false);
      }
    },
    [signer, tokenAddress]
  );

  const getBalance = useCallback(
    async (owner: string): Promise<ethers.BigNumber> => {
      if (!signer) return ethers.BigNumber.from(0);

      const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      return await token.balanceOf(owner);
    },
    [signer, tokenAddress]
  );

  const getDecimals = useCallback(async (): Promise<number> => {
    try {
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      return await token.decimals();
    } catch (error) {
      console.error("Error getting token decimals:", error);
      return 18;
    }
  }, [signer, tokenAddress]);

  return {
    checkAllowance,
    approve,
    getBalance,
    getDecimals,
    isApproving,
  };
}
