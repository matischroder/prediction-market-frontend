import "@rainbow-me/rainbowkit/styles.css";
import "../styles/globals.css";
import type { AppProps } from "next/app";

import {
  getDefaultWallets,
  RainbowKitProvider,
  darkTheme,
  lightTheme,
  Theme,
} from "@rainbow-me/rainbowkit";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useState, useEffect, useCallback } from "react";
import { useNetwork } from "wagmi";
import { Header } from "../components/Header";
import { MarketProvider } from "../context/MarketContext";
import { ChainlinkFeedsProvider } from "../context/ChainlinkFeedsContext";
import {
  getChainConfig,
  getProviderConfig,
  getWalletConfig,
} from "../config/chains";

// Configuración dinámica de cadenas
const chainConfig = getChainConfig();
const providerConfig = getProviderConfig();
const walletConfig = getWalletConfig();

const { chains, publicClient } = configureChains(
  chainConfig.chains,
  [publicProvider()],
  providerConfig
);

const { connectors } = getDefaultWallets({
  appName: walletConfig.appName,
  projectId: walletConfig.projectId,
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutos - datos son frescos por más tiempo
      gcTime: 15 * 60 * 1000, // 15 minutos - mantener en cache más tiempo
      retry: 1, // Solo 1 retry para evitar requests innecesarias
      refetchOnWindowFocus: false, // No refetch al cambiar de ventana
      refetchOnMount: false, // No refetch al montar si hay datos en cache
      refetchOnReconnect: false, // No refetch al reconectar
      refetchInterval: false, // Desactivar refetch automático por defecto
    },
    mutations: {
      retry: 1,
    },
  },
});

// Componente interno que tiene acceso a los hooks de wagmi
function AppWithMarketContract({
  Component,
  pageProps,
  dark,
  toggleDark,
  showCreateModal,
  setShowCreateModal,
}: {
  Component: any;
  pageProps: any;
  dark: boolean;
  toggleDark: () => void;
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;
}) {
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

  return (
    <MarketProvider factoryAddress={contractAddresses.marketFactory}>
      <ChainlinkFeedsProvider>
        <Header
          dark={dark}
          toggleDark={toggleDark}
          onCreateMarket={() => setShowCreateModal(true)}
        />
        <Component
          {...pageProps}
          showCreateModal={showCreateModal}
          setShowCreateModal={setShowCreateModal}
        />
      </ChainlinkFeedsProvider>
    </MarketProvider>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  // Estado global de dark mode
  const [dark, setDark] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Sincroniza con localStorage y la clase 'dark' en html
  useEffect(() => {
    const isDark =
      typeof window !== "undefined" &&
      (localStorage.getItem("theme") === "dark" ||
        (!localStorage.getItem("theme") &&
          window.matchMedia("(prefers-color-scheme: dark)").matches));
    setDark(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleDark = useCallback(() => {
    setDark((d) => {
      const next = !d;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
      return next;
    });
  }, []);

  // Paleta custom para RainbowKit
  const palette = {
    accentColor: dark ? "#60a5fa" : "#2563eb", // primary.dark / primary.light
    accentColorForeground: "#fff",
    borderRadius: "large" as const, // debe ser 'small' | 'medium' | 'large' | undefined
    fontStack: "system" as const, // debe ser 'system' | 'rounded' | undefined
    overlayBlur: "small" as const, // debe ser 'small' | 'large' | undefined
    connectButtonBackground: dark ? "#23232b" : "#fff",
    connectButtonText: dark ? "#f3f4f6" : "#1f2937",
    modalBackground: dark ? "#23232b" : "#fff",
    modalText: dark ? "#f3f4f6" : "#1f2937",
  };

  const rainbowTheme: Theme = dark
    ? darkTheme({
        accentColor: palette.accentColor,
        accentColorForeground: palette.accentColorForeground,
        borderRadius: palette.borderRadius,
        fontStack: palette.fontStack,
        overlayBlur: palette.overlayBlur,
      })
    : lightTheme({
        accentColor: palette.accentColor,
        accentColorForeground: palette.accentColorForeground,
        borderRadius: palette.borderRadius,
        fontStack: palette.fontStack,
        overlayBlur: palette.overlayBlur,
      });

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider
          chains={chains}
          theme={rainbowTheme}
          modalSize="compact"
          initialChain={chainConfig.defaultChain}
        >
          <AppWithMarketContract
            Component={Component}
            pageProps={pageProps}
            dark={dark}
            toggleDark={toggleDark}
            showCreateModal={showCreateModal}
            setShowCreateModal={setShowCreateModal}
          />
          {/* El modal CreateMarketModal se renderiza en cada página, no aquí */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#363636",
                color: "#fff",
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: "#22c55e",
                  secondary: "#fff",
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#fff",
                },
              },
            }}
          />
          {/* DevTools removido para reducir bundle size */}
        </RainbowKitProvider>
      </WagmiConfig>
    </QueryClientProvider>
  );
}
