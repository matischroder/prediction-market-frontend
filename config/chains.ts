import { Chain } from "wagmi";

// Configuración dinámica de redes
export const getChainConfig = () => {
  const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || "sepolia";

  // Configuración de Sepolia
  const sepoliaCustom: Chain = {
    id: 11155111,
    name: "Sepolia",
    network: "sepolia",
    nativeCurrency: {
      decimals: 18,
      name: "Sepolia Ether",
      symbol: "SEP",
    },
    rpcUrls: {
      public: { http: [process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || ""] },
      default: { http: [process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || ""] },
      alchemy: { http: [process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || ""] },
    },
    blockExplorers: {
      etherscan: { name: "Etherscan", url: "https://sepolia.etherscan.io" },
      default: { name: "Etherscan", url: "https://sepolia.etherscan.io" },
    },
    testnet: true,
  };

  return {
    chains: [sepoliaCustom],
    defaultChain: sepoliaCustom,
    isLocal: false,
  };
};

export const getProviderConfig = () => {
  const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || "sepolia";
  const isLocal = environment === "local";

  return {
    pollingInterval: isLocal ? 1000 : 5000, // 1s local, 5s remoto
    stallTimeout: isLocal ? 2000 : 10000, // 2s local, 10s remoto
  };
};

// Configuración de WalletConnect
export const getWalletConfig = () => {
  return {
    projectId:
      process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
      "2f05a7cfe8e3488ba24be3e2a1b7dc6a",
    appName: "Prediction Markets",
    appDescription: "Decentralized Prediction Markets",
    appUrl: "https://prediction-markets.com",
    appIcon: "https://prediction-markets.com/icon.png",
  };
};
