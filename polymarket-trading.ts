import { ClobClient, Side, OrderType } from "@polymarket/clob-client";
import { ethers } from "ethers";

// Polymarket configuration
const CHAIN_ID = 137; // Polygon mainnet
const host = "https://clob.polymarket.com";
const SIGNATURE_TYPE = 1; // For private key auth (0 = browser wallet, 1 = private key)

// Store client instance
let clobClient: ClobClient | null = null;
let walletAddress: string | null = null;

/**
 * Initialize the Polymarket CLOB client with private key
 */
export async function initializeClient(privateKey: string) {
  try {
    const wallet = new ethers.Wallet(privateKey);
    walletAddress = wallet.address;

    // Create temp client to derive API keys
    const tempClient = new ClobClient(host, CHAIN_ID, wallet as any);
    const creds = await tempClient.createOrDeriveApiKey();

    // Create authenticated CLOB client with API keys
    clobClient = new ClobClient(
      host,
      CHAIN_ID,
      wallet as any,
      creds,
      SIGNATURE_TYPE,
      walletAddress // funder address (same as wallet for most users)
    );

    console.log(`✓ Polymarket client initialized for ${walletAddress}`);
    return { success: true, address: walletAddress };
  } catch (error: any) {
    console.error("Failed to initialize Polymarket client:", error);
    throw new Error(`Client initialization failed: ${error.message}`);
  }
}

/**
 * Get the initialized client (throws if not initialized)
 */
function getClient(): ClobClient {
  if (!clobClient) {
    throw new Error("Polymarket client not initialized. Please set POLYMARKET_PRIVATE_KEY in .env");
  }
  return clobClient;
}

/**
 * Place a market order (BUY or SELL)
 * Uses current best price from orderbook
 */
export async function placeMarketOrder(params: {
  tokenId: string;
  amount: number; // USD amount
  side: "BUY" | "SELL";
}): Promise<any> {
  const client = getClient();

  try {
    // Get tick size and negRisk from the API
    const tickSize = await client.getTickSize(params.tokenId);
    const negRisk = await client.getNegRisk(params.tokenId);

    // For market orders, get current best price from orderbook
    const orderbook = await client.getOrderBook(params.tokenId);
    const price = params.side === "BUY"
      ? parseFloat(orderbook.asks[0]?.price || "0.5")
      : parseFloat(orderbook.bids[0]?.price || "0.5");

    // Calculate size (number of shares)
    const size = params.amount / price;

    console.log(`Placing ${params.side} order: ${size.toFixed(2)} shares at $${price} (total: $${params.amount})`);

    // Create and post order in one call
    const response = await client.createAndPostOrder(
      {
        tokenID: params.tokenId,
        price: price,
        size: size,
        side: params.side === "BUY" ? Side.BUY : Side.SELL,
      },
      {
        tickSize: tickSize,
        negRisk: negRisk,
      },
      OrderType.GTC // Good-til-cancelled
    );

    console.log("Order response:", response);

    return {
      success: !response.error,
      orderId: response.orderID,
      status: response.status,
      transactionHash: response.transactionHash,
      error: response.error,
      errorMsg: response.errorMsg,
    };
  } catch (error: any) {
    console.error("Order placement failed:", error);
    return {
      success: false,
      error: error.message,
      errorMsg: error.message,
    };
  }
}

/**
 * Place a limit order with specific price
 */
export async function placeLimitOrder(params: {
  tokenId: string;
  price: number; // Price as decimal (0-1)
  size: number; // Number of shares
  side: "BUY" | "SELL";
}): Promise<any> {
  const client = getClient();

  try {
    // Get tick size and negRisk from the API
    const tickSize = await client.getTickSize(params.tokenId);
    const negRisk = await client.getNegRisk(params.tokenId);

    console.log(`Placing limit ${params.side} order: ${params.size} shares at $${params.price}`);

    // Create and post order
    const response = await client.createAndPostOrder(
      {
        tokenID: params.tokenId,
        price: params.price,
        size: params.size,
        side: params.side === "BUY" ? Side.BUY : Side.SELL,
      },
      {
        tickSize: tickSize,
        negRisk: negRisk,
      },
      OrderType.GTC
    );

    return {
      success: !response.error,
      orderId: response.orderID,
      status: response.status,
      transactionHash: response.transactionHash,
      error: response.error,
      errorMsg: response.errorMsg,
    };
  } catch (error: any) {
    console.error("Limit order failed:", error);
    return {
      success: false,
      error: error.message,
      errorMsg: error.message,
    };
  }
}

/**
 * Get user's USDC balance
 */
export async function getBalance(): Promise<{
  usdc: number;
  address: string;
}> {
  if (!walletAddress) {
    throw new Error("No wallet connected");
  }

  try {
    // TODO: Implement balance check via CLOB API or Polygon RPC
    // For now, return placeholder
    return {
      usdc: 0,
      address: walletAddress,
    };
  } catch (error: any) {
    console.error("Failed to fetch balance:", error);
    return {
      usdc: 0,
      address: walletAddress,
    };
  }
}

/**
 * Check if client is initialized and ready
 */
export function isClientReady(): boolean {
  return clobClient !== null;
}

/**
 * Get current wallet address
 */
export function getWalletAddress(): string | null {
  return walletAddress;
}

/**
 * Logout and clear the client connection
 */
export function logout(): { success: boolean; message: string } {
  if (!clobClient && !walletAddress) {
    return {
      success: false,
      message: "No active session to logout from",
    };
  }

  const prevAddress = walletAddress;
  clobClient = null;
  walletAddress = null;

  console.log(`✓ Logged out from ${prevAddress}`);
  return {
    success: true,
    message: `Successfully logged out from ${prevAddress}`,
  };
}

/**
 * Demo/simulation mode - doesn't actually execute
 */
export async function simulateOrder(params: {
  tokenId: string;
  price: number;
  size: number;
  side: "BUY" | "SELL";
}): Promise<any> {
  console.log("🎭 DEMO MODE - Simulating order:", params);

  // Simulate a short delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    success: true,
    orderId: "demo_" + Math.random().toString(36).substring(7),
    status: "filled",
    transactionHash: "0xdemo" + Math.random().toString(16).substring(2, 18),
    executedPrice: params.price,
    executedSize: params.size,
    timestamp: Date.now(),
    isDemo: true,
  };
}
