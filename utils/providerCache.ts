import { ethers } from "ethers";

// Cache para evitar crear múltiples instancias de providers
const providerCache = new Map<string, ethers.providers.Web3Provider>();
const signerCache = new Map<string, ethers.providers.JsonRpcSigner>();

export function getCachedProvider(
  client: any
): ethers.providers.Web3Provider | undefined {
  if (!client) return undefined;

  const clientId = client.uid || client.account?.address || "default";

  if (!providerCache.has(clientId)) {
    const provider = new ethers.providers.Web3Provider(client);
    providerCache.set(clientId, provider);
  }

  return providerCache.get(clientId);
}

export function getCachedSigner(
  client: any
): ethers.providers.JsonRpcSigner | undefined {
  if (!client) return undefined;

  const clientId = client.uid || client.account?.address || "default";

  if (!signerCache.has(clientId)) {
    const provider = getCachedProvider(client);
    if (provider) {
      const signer = provider.getSigner();
      signerCache.set(clientId, signer);
    }
  }

  return signerCache.get(clientId);
}

// Limpiar cache cuando sea necesario
export function clearProviderCache() {
  providerCache.clear();
  signerCache.clear();
}

// Limpiar cache de un cliente específico
export function clearClientCache(clientId: string) {
  providerCache.delete(clientId);
  signerCache.delete(clientId);
}
