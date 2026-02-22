import { MCPServer, object, text, widget, error as mcpError } from "mcp-use/server";
import { z } from "zod";
import https from "https";
import { initializeClient, placeMarketOrder, placeLimitOrder, simulateOrder, isClientReady, getWalletAddress, logout } from "./polymarket-trading.js";

const server = new MCPServer({
  name: "polymarket",
  title: "Polymarket Prediction Markets",
  version: "1.0.0",
  description: "Browse and analyze Polymarket prediction markets with interactive widgets",
  baseUrl: process.env.MCP_URL || "http://localhost:3000",
  favicon: "favicon.ico",
  websiteUrl: "https://polymarket.com",
  icons: [
    {
      src: "icon.svg",
      mimeType: "image/svg+xml",
      sizes: ["512x512"],
    },
  ],
});

// Trading configuration
const TRADING_MODE = process.env.TRADING_MODE || "demo"; // "demo" or "real"

// Initialize Polymarket client if private key provided (async IIFE)
(async () => {
  if (process.env.POLYMARKET_PRIVATE_KEY) {
    try {
      const result = await initializeClient(process.env.POLYMARKET_PRIVATE_KEY);
      console.log(`✓ REAL TRADING ENABLED - Wallet: ${result.address}`);
    } catch (error: any) {
      console.error("❌ Failed to initialize trading client:", error.message);
      console.log("ℹ Falling back to DEMO MODE");
    }
  } else {
    console.log("ℹ DEMO MODE - No credentials found. Set POLYMARKET_PRIVATE_KEY for real trading.");
  }
})();

// ============================================================================
// POLYMARKET API HELPERS
// ============================================================================

async function fetchFromPolymarket(endpoint: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = `https://gamma-api.polymarket.com${endpoint}`;
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error("Failed to parse Polymarket response"));
          }
        });
      })
      .on("error", reject);
  });
}

async function fetchFromCLOB(endpoint: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = `https://clob.polymarket.com${endpoint}`;
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error("Failed to parse CLOB response"));
          }
        });
      })
      .on("error", reject);
  });
}

async function fetchFromDataAPI(endpoint: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = `https://data-api.polymarket.com${endpoint}`;
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error("Failed to parse Data API response"));
          }
        });
      })
      .on("error", reject);
  });
}

async function getPriceHistory(conditionId: string): Promise<any[]> {
  try {
    if (!conditionId) {
      return [];
    }

    // Use Data API /trades endpoint with condition_id
    const trades = await fetchFromDataAPI(`/trades?condition_id=${conditionId}&limit=200`);

    if (!Array.isArray(trades) || trades.length === 0) {
      console.log("No price history data returned");
      return [];
    }

    console.log(`Fetched ${trades.length} trades`);

    // Filter to only YES token trades (outcomeIndex: 0)
    const yesTrades = trades.filter((trade: any) => trade.outcomeIndex === 0);

    if (yesTrades.length === 0) {
      console.log("No YES token trades found");
      return [];
    }

    // Sample every 4th trade to get ~50 data points for smoother chart
    const history = yesTrades
      .filter((_, index) => index % 4 === 0)
      .map((trade: any) => ({
        t: trade.timestamp,
        p: parseFloat(trade.price || "0.5"),
      }))
      .sort((a, b) => a.t - b.t)
      .slice(-50);

    return history;
  } catch (e) {
    console.error("Error fetching price history:", e);
    return [];
  }
}

async function getMarkets(limit: number = 20, closed: boolean = false): Promise<any[]> {
  try {
    return await fetchFromPolymarket(`/markets?limit=${limit}&closed=${closed}`);
  } catch (e) {
    console.error("Error fetching markets:", e);
    return [];
  }
}

function hasTradeablePrice(market: any): boolean {
  try {
    const pricesStr = market.outcomePrices || '["0.5", "0.5"]';
    const prices = JSON.parse(pricesStr);
    return prices.some((p: string) => {
      const price = parseFloat(p);
      return price >= 0.05 && price <= 0.95;
    });
  } catch {
    return true;
  }
}

async function getTrendingMarkets(limit: number = 10): Promise<any[]> {
  try {
    const eventLimit = Math.max(20, limit * 2);
    const events = await fetchFromPolymarket(
      `/events?active=true&closed=false&order=volume24hr&ascending=false&limit=${eventLimit}`
    );

    if (!Array.isArray(events)) {
      return [];
    }

    // Take only the highest volume market from each event to ensure diversity
    const uniqueMarkets: any[] = [];

    for (const event of events) {
      const eventMarkets = event.markets || [];

      // Filter valid markets from this event
      const validMarkets = eventMarkets.filter((market: any) => {
        if (!market || !market.question) return false;
        if (market.acceptingOrders === false) return false;

        const liquidity = parseFloat(market.liquidity || "0");
        if (!Number.isNaN(liquidity) && liquidity > 0 && liquidity < 5000) return false;

        return hasTradeablePrice(market);
      });

      // Pick the market with highest volume from this event
      if (validMarkets.length > 0) {
        const bestMarket = validMarkets.reduce((best: any, current: any) => {
          const bestVol = parseFloat(best.volume24hr || best.volumeNum || best.volume || "0");
          const currentVol = parseFloat(current.volume24hr || current.volumeNum || current.volume || "0");
          return currentVol > bestVol ? current : best;
        });
        uniqueMarkets.push(bestMarket);
      }

      // Stop once we have enough markets
      if (uniqueMarkets.length >= limit) {
        break;
      }
    }

    return uniqueMarkets.slice(0, limit);
  } catch (e) {
    console.error("Error fetching trending markets:", e);
    return [];
  }
}

async function getRecentMarkets(limit: number = 10): Promise<any[]> {
  try {
    const eventLimit = Math.max(20, limit * 2);
    const events = await fetchFromPolymarket(
      `/events?active=true&closed=false&order=id&ascending=false&limit=${eventLimit}`
    );

    if (!Array.isArray(events)) {
      return [];
    }

    const now = Date.now();
    const markets: any[] = [];

    for (const event of events) {
      const eventMarkets = Array.isArray(event.markets) ? event.markets : [];
      for (const market of eventMarkets) {
        if (!market) continue;
        if (market.closed === true) continue;
        if (market.active === false) continue;

        if (market.endDate) {
          const endDate = new Date(market.endDate).getTime();
          if (endDate < now) continue;
        }

        markets.push(market);
        if (markets.length >= limit) break;
      }
      if (markets.length >= limit) break;
    }

    return markets.slice(0, limit);
  } catch (e) {
    console.error("Error fetching recent markets:", e);
    return [];
  }
}

async function searchMarkets(keyword: string, limit: number = 50): Promise<any[]> {
  try {
    const keywordTrimmed = sanitizeKeywordInput(keyword);
    if (!keywordTrimmed) return [];

    const keywordLower = keywordTrimmed.toLowerCase();
    const keywordTokens = normalizeText(keywordTrimmed).split(" ").filter(Boolean);
    const now = Date.now();
    const pageSize = 100;
    const maxPages = 20;

    const slug = extractSlugFromInput(keywordTrimmed);
    if (slug) {
      const marketsBySlug = await getMarketsBySlug(slug);
      if (marketsBySlug.length > 0) return marketsBySlug.slice(0, limit);
    }

    // Use public search (official Gamma API) to match Polymarket site behavior
    try {
      const limitPerType = Math.max(10, limit);
      const data = await fetchFromPolymarket(
        `/public-search?q=${encodeURIComponent(keywordTrimmed)}&events_status=active&limit_per_type=${limitPerType}&search_profiles=false&search_tags=true&page=1&sort=relevance&ascending=false`
      );
      const events = Array.isArray(data?.events) ? data.events : [];
      const filtered = new Map<string, any>();
      const unfiltered = new Map<string, any>();

      events.forEach((event: any) => {
        const eventTitle = event?.title || event?.name || "";
        const eventSlug = event?.slug || "";
        const markets = Array.isArray(event?.markets) ? event.markets : [];

        markets.forEach((market: any) => {
          if (!market) return;

          market.__eventTitle = eventTitle;
          market.__eventSlug = eventSlug;

          const id = market.id || market.conditionId || market.question;
          unfiltered.set(id, market);

          if (market.closed === true) return;
          if (market.active === false) return;

          if (market.endDate) {
            const endDate = new Date(market.endDate).getTime();
            if (endDate < now) return;
          }

          filtered.set(id, market);
        });
      });

      const source = filtered.size > 0 ? filtered : unfiltered;
      const results = Array.from(source.values())
        .map((market) => ({
          market,
          score: scoreMarketMatch(
            market,
            keywordTrimmed,
            `${market.__eventTitle || ""} ${market.__eventSlug || ""}`
          ),
        }))
        .sort((a, b) => b.score - a.score)
        .map(({ market }) => market)
        .slice(0, limit);

      if (results.length > 0) return results;
    } catch (e) {
      console.error("Public search failed, falling back to tag/event scan:", e);
    }

    const tagMatch = await findTagByKeyword(keywordTrimmed);
    const tagId = tagMatch ? getTagId(tagMatch) : undefined;
    if (tagId !== undefined) {
      const marketsByTag = await getMarketsByTag(tagId, limit);
      if (marketsByTag.length > 0) return marketsByTag;
    }

    const scored = new Map<string, { market: any; score: number }>();
    const looseMatches = new Map<string, { market: any; score: number }>();

    for (let page = 0; page < maxPages; page++) {
      const offset = page * pageSize;
      const events = await fetchFromPolymarket(
        `/events?active=true&closed=false&order=id&ascending=false&limit=${pageSize}&offset=${offset}`
      );

      if (!Array.isArray(events) || events.length === 0) {
        break;
      }

      events.forEach(event => {
        const eventTitle = (event.title || event.name || "");
        const eventSlug = (event.slug || "");
        const eventTitleLower = eventTitle.toLowerCase();
        const eventSlugLower = eventSlug.toLowerCase();

        if (event.markets && Array.isArray(event.markets)) {
          event.markets.forEach((market: any) => {
            if (!market) return;
            if (market.closed === true) return;
            if (market.active === false) return;

            if (market.endDate) {
              const endDate = new Date(market.endDate).getTime();
              if (endDate < now) return;
            }

            const question = market.question || event.title || "";
            const questionLower = question.toLowerCase();
            const haystack = normalizeText(`${questionLower} ${eventTitleLower} ${eventSlugLower}`);

            const matchesAllTokens = keywordTokens.length === 0
              ? haystack.includes(keywordLower)
              : keywordTokens.every((token) => haystack.includes(token));
            const matchesAnyToken = keywordTokens.length === 0
              ? haystack.includes(keywordLower)
              : keywordTokens.some((token) => haystack.includes(token));

            if (!matchesAnyToken) return;

            market.__eventTitle = eventTitle;
            market.__eventSlug = eventSlug;

            const id = market.id || market.conditionId || question;
            if (!market.question) {
              market.question = question;
            }
            const score = scoreMarketMatch(market, keywordTrimmed, `${eventTitle} ${eventSlug}`);
            if (matchesAllTokens) {
              scored.set(id, { market, score });
            } else {
              looseMatches.set(id, { market, score: score * 0.7 });
            }
          });
        }
      });

      if (scored.size >= limit * 3) {
        break;
      }
    }

    const primary = scored.size > 0 ? scored : looseMatches;
    return Array.from(primary.values())
      .sort((a, b) => b.score - a.score)
      .map(({ market }) => market)
      .slice(0, limit);
  } catch (e) {
    console.error("Error searching markets:", e);
    return [];
  }
}

function formatVolume(volume: any): string {
  const vol = parseFloat(volume) || 0;
  if (vol > 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
  if (vol > 1000) return `$${(vol / 1000).toFixed(1)}K`;
  return `$${vol.toFixed(0)}`;
}

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function sanitizeKeywordInput(input: string): string {
  const original = input.trim();
  let q = original;
  if (!q) return q;

  q = q.replace(/^["'`]+|["'`]+$/g, "");

  const prefixPatterns = [
    /^(search\s+markets\s+for:)\s*/i,
    /^(search\s+markets\s+for)\s*/i,
    /^(search\s+for:)\s*/i,
    /^(search\s+for)\s*/i,
    /^(search\s+markets:)\s*/i,
    /^(search\s+markets)\s*/i,
    /^(show\s+me)\s*/i,
    /^(find)\s*/i,
  ];

  for (const pattern of prefixPatterns) {
    if (pattern.test(q)) {
      q = q.replace(pattern, "").trim();
      break;
    }
  }

  const colonIndex = q.lastIndexOf(":");
  if (colonIndex > 0 && colonIndex < q.length - 1) {
    const afterColon = q.slice(colonIndex + 1).trim();
    if (afterColon.length >= 2) {
      q = afterColon;
    }
  }

  if (!q || q.length < 2) {
    return original;
  }

  return q;
}

function extractSlugFromInput(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    if (trimmed.includes("polymarket.com")) {
      const url = new URL(trimmed);
      const parts = url.pathname.split("/").filter(Boolean);
      const idx = parts.findIndex((p) => p === "event" || p === "market");
      if (idx >= 0 && parts[idx + 1]) {
        return parts[idx + 1];
      }
    }
  } catch {
    // Ignore URL parsing errors
  }

  const pathMatch = trimmed.match(/(?:event|market)\/([a-z0-9-]+)/i);
  if (pathMatch?.[1]) return pathMatch[1];

  if (!trimmed.includes(" ") && /^[a-z0-9-]{4,}$/i.test(trimmed)) {
    return trimmed;
  }

  return null;
}

async function getMarketsBySlug(slug: string): Promise<any[]> {
  try {
    const market = await fetchFromPolymarket(`/markets/slug/${encodeURIComponent(slug)}`);
    if (Array.isArray(market)) return market;
    return market ? [market] : [];
  } catch (e) {
    console.error("Error fetching markets by slug:", e);
    return [];
  }
}

async function getEventsBySlug(slug: string): Promise<any[]> {
  try {
    const event = await fetchFromPolymarket(`/events/slug/${encodeURIComponent(slug)}`);
    if (Array.isArray(event)) return event;
    return event ? [event] : [];
  } catch (e) {
    console.error("Error fetching events by slug:", e);
    return [];
  }
}

let tagCache: any[] | null = null;

async function getTags(): Promise<any[]> {
  if (tagCache) return tagCache;
  try {
    const tags = await fetchFromPolymarket("/tags");
    tagCache = Array.isArray(tags) ? tags : [];
    return tagCache;
  } catch (e) {
    console.error("Error fetching tags:", e);
    return [];
  }
}

function getTagId(tag: any): string | number | undefined {
  return tag?.id ?? tag?.tag_id ?? tag?.tagId;
}

async function findTagByKeyword(keyword: string): Promise<any | undefined> {
  const tags = await getTags();
  const keywordNorm = normalizeText(keyword);
  if (!keywordNorm) return undefined;

  const exact = tags.find((tag) => normalizeText(tag?.name || "") === keywordNorm);
  if (exact) return exact;

  return tags.find((tag) => {
    const name = normalizeText(tag?.name || "");
    return name && (name.includes(keywordNorm) || keywordNorm.includes(name));
  });
}

async function getMarketsByTag(tagId: string | number, limit: number): Promise<any[]> {
  try {
    const events = await fetchFromPolymarket(
      `/events?tag_id=${tagId}&related_tags=true&active=true&closed=false&order=id&ascending=false&limit=${Math.max(50, limit)}`
    );

    if (!Array.isArray(events)) return [];

    const now = Date.now();
    const markets: any[] = [];

    events.forEach((event) => {
      const eventTitle = event?.title || event?.name || "";
      const eventSlug = event?.slug || "";
      const eventMarkets = Array.isArray(event?.markets) ? event.markets : [];

      eventMarkets.forEach((market: any) => {
        if (!market) return;
        if (market.closed === true) return;
        if (market.active === false) return;
        if (market.endDate) {
          const endDate = new Date(market.endDate).getTime();
          if (endDate < now) return;
        }
        market.__eventTitle = eventTitle;
        market.__eventSlug = eventSlug;
        markets.push(market);
      });
    });

    return markets.slice(0, limit);
  } catch (e) {
    console.error("Error fetching markets by tag:", e);
    return [];
  }
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreMarketMatch(market: any, keyword: string, context?: string): number {
  const question = market.question || "";
  const questionNorm = normalizeText(question);
  const keywordNorm = normalizeText(keyword);
  const contextNorm = context ? normalizeText(context) : "";

  if (!questionNorm || !keywordNorm) return 0;

  let score = 0;

  const haystack = `${questionNorm} ${contextNorm}`.trim();

  if (questionNorm === keywordNorm || haystack === keywordNorm) score += 1000;
  if (questionNorm.startsWith(keywordNorm) || haystack.startsWith(keywordNorm)) score += 300;
  if (questionNorm.includes(keywordNorm) || haystack.includes(keywordNorm)) score += 200;

  const questionWords = new Set(haystack.split(" ").filter(Boolean));
  const keywordWords = keywordNorm.split(" ").filter(Boolean);

  let matchedWords = 0;
  keywordWords.forEach((word) => {
    if (questionWords.has(word)) {
      matchedWords += 1;
      score += 25;
    }
  });

  if (matchedWords === keywordWords.length && matchedWords > 0) {
    score += 120;
  }

  const vol = parseFloat(market.volume24hr || market.volumeNum || market.volume || "0");
  score += Math.log10(vol + 1);

  return score;
}

function selectBestMarket(markets: any[], keyword: string): any | undefined {
  const now = Date.now();
  const scored = markets
    .filter((market) => {
      if (!market) return false;
      if (!market.question) return false;
      if (market.closed === true) return false;
      if (market.active === false) return false;
      if (market.endDate) {
        const endDate = new Date(market.endDate).getTime();
        if (endDate < now) return false;
      }
      return true;
    })
    .map((market) => ({
      market,
      score: scoreMarketMatch(market, keyword, market.__eventTitle || market.__eventSlug),
    }))
    .sort((a, b) => b.score - a.score);

  return scored[0]?.market;
}

function getPriceData(market: any) {
  const pricesStr = market.outcomePrices || '["0.5", "0.5"]';
  const prices = JSON.parse(pricesStr);
  return {
    yesPrice: parseFloat(prices[0] || "0.5"),
    noPrice: parseFloat(prices[1] || "0.5"),
  };
}

function getTokenId(market: any, side: "YES" | "NO"): string | null {
  try {
    const clobTokenIds = market.clobTokenIds;
    if (!clobTokenIds) return null;

    const tokens = JSON.parse(clobTokenIds);
    if (!Array.isArray(tokens) || tokens.length < 2) return null;

    // Index 0 = YES token, Index 1 = NO token
    return side === "YES" ? tokens[0] : tokens[1];
  } catch (e) {
    console.error("Failed to parse clobTokenIds:", e);
    return null;
  }
}

// ============================================================================
// TOOLS
// ============================================================================

server.tool(
  {
    name: "welcome",
    description: "Show welcome screen and introduction to Polymarket MCP",
    schema: z.object({
      userName: z.string().optional().describe("User's name (optional)"),
    }),
    widget: {
      name: "welcome",
      invoking: "Loading welcome screen...",
      invoked: "Welcome!",
    },
  },
  async ({ userName }) => {
    return widget({
      props: {
        userName: userName,
        isFirstTime: true,
      },
      output: text("Welcome to Polymarket MCP! This app helps you explore prediction markets directly in Claude."),
    });
  }
);

server.tool(
  {
    name: "login",
    description: "Login to Polymarket to access portfolio and personalized features",
    schema: z.object({
      autoConnect: z.boolean().optional().describe("Automatically attempt connection if credentials exist"),
    }),
    widget: {
      name: "login",
      invoking: "Loading login...",
      invoked: "Login ready",
    },
  },
  async ({ autoConnect }) => {
    return widget({
      props: {
        loginStatus: "pending",
      },
      output: text("Connect your Polymarket account to access portfolio features, track positions, and get personalized recommendations."),
    });
  }
);

server.tool(
  {
    name: "logout",
    description: "Logout from Polymarket and clear your API key from the current session",
    schema: z.object({}),
  },
  async () => {
    const result = logout();

    if (result.success) {
      return object({
        status: "success",
        message: result.message,
        output: text(`✓ ${result.message}\n\nYour API key has been cleared from this session. You'll need to login again to access trading features.`),
      });
    } else {
      return object({
        status: "error",
        message: result.message,
        output: text(`ℹ ${result.message}`),
      });
    }
  }
);

server.tool(
  {
    name: "view_portfolio",
    description: "View a concise portfolio summary",
    schema: z.object({
      walletAddress: z.string().optional().describe("Wallet address (optional)"),
      limit: z.number().optional().describe("Max positions to display (default: 6)"),
    }),
    widget: {
      name: "portfolio",
      invoking: "Loading portfolio...",
      invoked: "Portfolio loaded",
    },
  },
  async ({ walletAddress, limit = 6 }) => {
    const positions: any[] = [];
    const totalValue = formatCurrency(0);
    const pnl = "0.0%";

    return widget({
      props: {
        positions,
        totalValue,
        pnl,
      },
      output: text(
        walletAddress
          ? `Portfolio loaded for ${walletAddress}.`
          : "Portfolio loaded. Connect a wallet to see positions."
      ),
    });
  }
);

server.tool(
  {
    name: "recent_markets",
    description: "Get the most recent Polymarket prediction markets with interactive widget",
    schema: z.object({
      limit: z.number().optional().describe("Number of markets (default: 10)"),
    }),
    widget: {
      name: "market-explorer",
      invoking: "Loading recent markets...",
      invoked: "Recent markets loaded",
    },
  },
  async ({ limit = 10 }) => {
    const markets = await getRecentMarkets(limit);

    if (markets.length === 0) {
      return text("Unable to fetch recent markets from Polymarket.");
    }

    const formattedMarkets = markets.map((market) => {
      const { yesPrice, noPrice } = getPriceData(market);
      const volume = market.volumeNum || market.volume || 0;

      return {
        id: market.id || market.condition_id || String(Math.random()),
        question: market.question,
        slug: market.slug || market.marketSlug || market.condition_id || market.conditionId,
        yesPrice,
        noPrice,
        volume: formatVolume(volume),
        category: market.category || market.groupItemTitle || "Recent",
      };
    });

    return widget({
      props: {
        markets: formattedMarkets,
        totalMarkets: formattedMarkets.length,
      },
      output: text(`Showing ${formattedMarkets.length} recent markets.`),
    });
  }
);

server.tool(
  {
    name: "search_markets",
    description: "Search Polymarket prediction markets by keyword with interactive widget",
    schema: z.object({
      keyword: z.string().describe("Search term (e.g., 'Trump', 'bitcoin', 'AI')"),
      limit: z.number().optional().describe("Max results (default: 10)"),
    }),
    widget: {
      name: "market-explorer",
      invoking: "Searching markets...",
      invoked: "Markets found",
    },
  },
  async ({ keyword, limit = 10 }) => {
    const markets = await searchMarkets(keyword, 50);

    if (markets.length === 0) {
      return text(`No markets found matching "${keyword}"`);
    }

    const displayMarkets = markets.slice(0, limit);

    const formattedMarkets = displayMarkets.map((market) => {
      const { yesPrice, noPrice } = getPriceData(market);
      const volume = market.volumeNum || market.volume || 0;

      return {
        id: market.id || market.condition_id || String(Math.random()),
        question: market.question,
        slug: market.slug || market.marketSlug || market.condition_id || market.conditionId,
        yesPrice,
        noPrice,
        volume: formatVolume(volume),
        category: market.category || market.groupItemTitle || "General",
      };
    });

    return widget({
      props: {
        markets: formattedMarkets,
        totalMarkets: markets.length,
        query: keyword,
      },
      output: text(`Found ${markets.length} markets matching "${keyword}". Click any market to view detailed charts.`),
    });
  }
);

server.tool(
  {
    name: "trending_markets",
    description: "Get the top trending Polymarket prediction markets with interactive widget",
    schema: z.object({
      limit: z.number().optional().describe("Number of markets (default: 10)"),
    }),
    widget: {
      name: "market-explorer",
      invoking: "Loading trending markets...",
      invoked: "Trending markets loaded",
    },
  },
  async ({ limit = 10 }) => {
    const markets = await getTrendingMarkets(limit);

    if (markets.length === 0) {
      return text("Unable to fetch markets from Polymarket.");
    }

    const formattedMarkets = markets.map((market) => {
      const { yesPrice, noPrice } = getPriceData(market);
      const volume = market.volumeNum || market.volume || 0;

      return {
        id: market.id || market.condition_id || String(Math.random()),
        question: market.question,
        slug: market.slug || market.marketSlug || market.condition_id || market.conditionId,
        yesPrice,
        noPrice,
        volume: formatVolume(volume),
        category: market.category || market.groupItemTitle || "Trending",
      };
    });

    return widget({
      props: {
        markets: formattedMarkets,
        totalMarkets: formattedMarkets.length,
      },
      output: text(`Showing ${formattedMarkets.length} trending markets. Click any market to view detailed charts and analysis.`),
    });
  }
);

server.tool(
  {
    name: "execute_trade",
    description: "Prepare a trade for execution on Polymarket. Searches for the market and shows confirmation widget.",
    schema: z.object({
      marketKeyword: z.string().describe("Search keyword to find the market"),
      side: z.enum(["YES", "NO"]).describe("Which outcome to buy (YES or NO)"),
      amount: z.number().default(100).describe("Amount in USD to trade (default: 100)"),
    }),
    widget: {
      name: "trade-confirmation",
      invoking: "Preparing trade...",
      invoked: "Trade ready for confirmation",
    },
  },
  async ({ marketKeyword, side, amount = 100 }) => {
    // Search for the market
    const markets = await searchMarkets(marketKeyword, 5);

    if (markets.length === 0) {
      return mcpError(`No market found for "${marketKeyword}". Please try a different search term.`);
    }

    const market = markets[0];
    const { yesPrice, noPrice } = getPriceData(market);
    const price = side === "YES" ? yesPrice : noPrice;

    // Get tokenId for the selected side
    const tokenId = getTokenId(market, side);

    if (!tokenId) {
      return mcpError("Unable to get token ID for this market. It may not be tradeable.");
    }

    // Calculate estimates
    const validPrice = Math.max(0.01, Math.min(0.99, price));
    const estimatedShares = amount / validPrice;
    const potentialProfit = amount * ((1 - validPrice) / validPrice);

    return widget({
      props: {
        marketTitle: market.question,
        marketId: market.id || market.conditionId,
        conditionId: market.conditionId,
        side,
        action: "BUY",
        amount,
        price: validPrice,
        estimatedShares,
        potentialProfit,
        tokenId: tokenId,
        isRealTradingEnabled: isClientReady(),
      },
      output: text(
        `Trade prepared: BUY ${amount} USD of ${side} on "${market.question}" at ${Math.round(validPrice * 100)}¢ (${estimatedShares.toFixed(2)} shares). ` +
        (isClientReady()
          ? "Click confirm to execute this REAL trade."
          : "Demo mode - this will be a simulated trade.")
      ),
    });
  }
);

server.tool(
  {
    name: "confirm_trade_execution",
    description: "Execute a real trade on Polymarket. This tool is called by the trade confirmation widget.",
    schema: z.object({
      tokenId: z.string().describe("CLOB token ID for the outcome"),
      amount: z.number().describe("Amount in USD to trade"),
      side: z.enum(["YES", "NO"]).describe("Which outcome to buy"),
      marketTitle: z.string().describe("Market question/title for logging"),
    }),
  },
  async ({ tokenId, amount, side, marketTitle }) => {
    // Check if real trading is enabled
    if (!isClientReady()) {
      // Fallback to demo mode
      const result = await simulateOrder({
        tokenId,
        price: 0.5,
        size: amount / 0.5,
        side: "BUY",
      });

      return object({
        success: true,
        isDemo: true,
        orderId: result.orderId,
        status: result.status,
        transactionHash: result.transactionHash,
        message: `Demo trade executed successfully! In real mode, this would have bought ${side} shares on "${marketTitle}".`,
      });
    }

    // Execute real trade
    try {
      const result = await placeMarketOrder({
        tokenId,
        amount,
        side: "BUY", // Always BUY for now (selling requires holding shares)
      });

      if (result.success) {
        return object({
          success: true,
          isDemo: false,
          orderId: result.orderId,
          status: result.status,
          transactionHash: result.transactionHash,
          message: `Trade executed successfully! Order ID: ${result.orderId}`,
        });
      } else {
        return mcpError(
          `Trade failed: ${result.errorMsg || result.error || "Unknown error"}. ` +
          `Please check your balance and try again.`
        );
      }
    } catch (error: any) {
      console.error("Trade execution error:", error);
      return mcpError(`Trade execution failed: ${error.message}`);
    }
  }
);

server.tool(
  {
    name: "view_market",
    description: "View detailed prediction market data with interactive price charts",
    schema: z.object({
      keyword: z.string().describe("Search keyword for the market"),
    }),
    widget: {
      name: "market-view",
      invoking: "Loading market data and charts...",
      invoked: "Market loaded with charts",
    },
  },
  async ({ keyword }) => {
    const cleanKeyword = sanitizeKeywordInput(keyword);
    const slug = extractSlugFromInput(keyword) || extractSlugFromInput(cleanKeyword);
    let marketData: any | undefined;

    if (slug) {
      const slugMarkets = await getMarketsBySlug(slug);
      if (slugMarkets.length > 0) {
        marketData = selectBestMarket(slugMarkets, keyword) || slugMarkets[0];
      }

      if (!marketData) {
        const slugEvents = await getEventsBySlug(slug);
        const eventMarkets = slugEvents.flatMap((event: any) => event.markets || []);
        if (eventMarkets.length > 0) {
          marketData = selectBestMarket(eventMarkets, keyword) || eventMarkets[0];
        }
      }
    }

    if (!marketData) {
      const markets = await searchMarkets(cleanKeyword, 50);
      marketData = selectBestMarket(markets, cleanKeyword);
    }

    if (!marketData) {
      return text(`No market found for "${keyword}"`);
    }

    const { yesPrice, noPrice } = getPriceData(marketData);
    const volume = marketData.volumeNum || marketData.volume || 0;

    // Fetch price history for charts using conditionId
    const conditionId = marketData.conditionId || marketData.condition_id;
    const priceHistory = conditionId ? await getPriceHistory(conditionId) : [];

    return widget({
      props: {
        title: marketData.question,
        yesPrice: yesPrice,
        noPrice: noPrice,
        volume: formatVolume(volume),
        priceHistory: priceHistory.map((point: any) => ({
          timestamp: point.t || point.timestamp,
          price: parseFloat(point.p || point.price || "0.5"),
        })),
      },
      output: text(`${marketData.question}\nYES: ${Math.round(yesPrice * 100)}¢ | NO: ${Math.round(noPrice * 100)}¢\nShowing price history chart.`),
    });
  }
);

server.listen().then(() => {
  console.log(`Server running`);
});
