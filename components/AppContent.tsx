import { useState } from "react";
import { useNetwork } from "wagmi";
import { useMarketContract } from "../hooks/useMarketContract";
import { Header } from "./Header";

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

  // Get contract addresses from env based on network
  const contractAddresses = {
    marketFactory: process.env.NEXT_PUBLIC_MARKET_FACTORY_ADDRESS || "",
    usdc: process.env.NEXT_PUBLIC_USDC_ADDRESS || "",
    proofOfReserves: process.env.NEXT_PUBLIC_PROOF_OF_RESERVES_ADDRESS || "",
    ccipBridge: process.env.NEXT_PUBLIC_CCIP_BRIDGE_ADDRESS || "",
    chainlinkFunctions:
      process.env.NEXT_PUBLIC_CHAINLINK_FUNCTIONS_ADDRESS || "",
  };

  // Hook para obtener la función createMarket
  const { createMarket, markets, loading } = useMarketContract(
    contractAddresses.marketFactory
  );

  return (
    <>
      <Header
        dark={dark}
        toggleDark={toggleDark}
        onCreateMarket={() => setShowCreateModal(true)}
      />
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
