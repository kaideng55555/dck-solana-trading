// Price Service - Fetches live token prices from Birdeye API
// QuickNode RPC: https://ultra-ultra-fog.solana-mainnet.quiknode.pro/48fa88a641cbd2a15f2e0c4f8d9c96c41c70fcf5/

const BIRDEYE_API = "https://public-api.birdeye.so/public";
const BIRDEYE_API_KEY = import.meta.env.VITE_BIRDEYE_API_KEY || "your-actual-key";

const QUICKNODE_RPC = "https://ultra-ultra-fog.solana-mainnet.quiknode.pro/48fa88a641cbd2a15f2e0c4f8d9c96c41c70fcf5/";

// Known token addresses
export const TOKENS = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  BONK: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
};

/**
 * Fetch token price from Birdeye
 * @param {string} mintAddress - Token mint address
 * @returns {Promise<{price: number, priceChange24h: number}>}
 */
export async function getTokenPrice(mintAddress) {
  try {
    const response = await fetch(`${BIRDEYE_API}/price?address=${mintAddress}`, {
      headers: {
        "Authorization": `Bearer ${BIRDEYE_API_KEY}`,
        "X-API-KEY": BIRDEYE_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Birdeye API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      price: data.data?.value || 0,
      priceChange24h: data.data?.priceChange24h || 0,
    };
  } catch (error) {
    console.error("Error fetching price:", error);
    return { price: 0, priceChange24h: 0 };
  }
}

/**
 * Fetch multiple token prices
 * @param {string[]} mintAddresses - Array of token mint addresses
 * @returns {Promise<Object>}
 */
export async function getMultipleTokenPrices(mintAddresses) {
  const prices = {};
  await Promise.all(
    mintAddresses.map(async (address) => {
      prices[address] = await getTokenPrice(address);
    })
  );
  return prices;
}

/**
 * Fetch token metadata from Birdeye
 * @param {string} mintAddress - Token mint address
 */
export async function getTokenMetadata(mintAddress) {
  try {
    const response = await fetch(`${BIRDEYE_API}/token_overview?address=${mintAddress}`, {
      headers: {
        "Authorization": `Bearer ${BIRDEYE_API_KEY}`,
        "X-API-KEY": BIRDEYE_API_KEY,
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching metadata:", error);
    return null;
  }
}

/**
 * Subscribe to real-time price updates (polling-based)
 * @param {string} mintAddress - Token mint address
 * @param {function} onUpdate - Callback when price updates
 * @param {number} intervalMs - Poll interval in ms (default 5000)
 * @returns {function} Unsubscribe function
 */
export function subscribeToPriceUpdates(mintAddress, onUpdate, intervalMs = 5000) {
  let isActive = true;

  const poll = async () => {
    if (!isActive) return;
    
    const priceData = await getTokenPrice(mintAddress);
    onUpdate(priceData);
    
    if (isActive) {
      setTimeout(poll, intervalMs);
    }
  };

  poll();

  return () => {
    isActive = false;
  };
}

// Export QuickNode RPC for Solana connections
export const SOLANA_RPC = QUICKNODE_RPC;
