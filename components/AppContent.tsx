import { useState } from "react";
import { useNetwork } from "wagmi";
import { useMarketContract } from "../hooks/useMarketContract";
import { useAutoFunding } from "../hooks/useAutoFunding";
import { Header } from "./Header";
import { getContractAddress } from "../utils/contracts";

interface AppContentProps {
  Component: any;
  pageProps: any;
  dark: boolean;
  toggleDark: () => void;
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;
}

export function AppContent({
  Component,
  pageProps,
  dark,
  toggleDark,
  showCreateModal,
  setShowCreateModal,
}: AppContentProps) {
  const { chain } = useNetwork();

  // Get contract addresses from deployed addresses
  const contractAddresses = {
    marketFactory: getContractAddress("marketFactory"),
    nostronet: getContractAddress("nostronet"),
  };

  // Hook para obtener la función createMarket
  const { createMarket, markets, loading } = useMarketContract(
    contractAddresses.marketFactory
  );

  // Auto-funding hook (automatically funds new wallets)
  useAutoFunding();

  return (
    <>
      <Header dark={dark} toggleDark={toggleDark} />
      <Component
        {...pageProps}
        showCreateModal={showCreateModal}
        setShowCreateModal={setShowCreateModal}
        createMarket={createMarket}
        markets={markets}
        loading={loading}
      />
    </>
  );
}
