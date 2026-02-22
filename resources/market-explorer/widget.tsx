import { McpUseProvider, useWidget, type WidgetMetadata } from "mcp-use/react";
import React, { useState } from "react";
import "../styles.css";
import type { MarketExplorerProps, MarketExplorerState, Market } from "./types";
import { propSchema } from "./types";

export const widgetMetadata: WidgetMetadata = {
  description: "Browse and explore Polymarket prediction markets",
  props: propSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: false,
    invoking: "Loading markets...",
    invoked: "Markets loaded",
  },
};

const MarketCard: React.FC<{
  market: Market;
  onClick: () => void;
}> = ({ market, onClick }) => {
  const yesPercent = Math.round(market.yesPrice * 100);
  const noPercent = Math.round(market.noPrice * 100);

  return (
    <div
      onClick={onClick}
      className="pm-card p-5 cursor-pointer"
    >
      {/* Category Badge */}
      {market.category && (
        <div className="flex items-center gap-2 mb-3">
          <span className="pm-pill">
            {market.category}
          </span>
        </div>
      )}

      {/* Question */}
      <h3 className="pm-card-title font-semibold text-md mb-4 line-clamp-2">
        {market.question}
      </h3>
      {market.slug && (
        <div className="text-[11px] text-secondary mb-3 font-mono truncate">
          {market.slug}
        </div>
      )}

      {/* Price Indicators */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* YES */}
        <div className="pm-mini pm-mini-yes">
          <div className="text-xs text-secondary mb-1 font-medium">YES</div>
          <div className="text-2xl font-bold pm-stat">
            {yesPercent}¢
          </div>
        </div>

        {/* NO */}
        <div className="pm-mini pm-mini-no">
          <div className="text-xs text-secondary mb-1 font-medium">NO</div>
          <div className="text-2xl font-bold pm-stat">
            {noPercent}¢
          </div>
        </div>
      </div>

      {/* Volume */}
      <div className="flex items-center justify-between text-xs text-secondary">
        <span>Volume</span>
        <span className="font-mono font-medium">{market.volume}</span>
      </div>
    </div>
  );
};

const MarketExplorer: React.FC = () => {
  const { props, isPending, state, setState, sendFollowUpMessage } = useWidget<
    MarketExplorerProps,
    MarketExplorerState
  >();
  const [searchQuery, setSearchQuery] = useState("");

  if (isPending) {
    return (
      <McpUseProvider>
        <div className="pm-frame pm-compact">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-default/10 rounded w-1/3" />
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-48 bg-default/10 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </McpUseProvider>
    );
  }

  const { markets, totalMarkets, query, category } = props;
  const view = state?.view || "grid";

  const handleMarketClick = (market: Market) => {
    setState({ ...state, selectedMarketId: market.id });
    sendFollowUpMessage(`Show me detailed chart for: ${market.question}`);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      sendFollowUpMessage(`Search markets for: ${searchQuery}`);
    }
  };

  return (
    <McpUseProvider>
      <div className="pm-frame">
        {/* Header */}
        <div className="pm-header pm-compact">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-semibold">Market Explorer</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="pm-pill">
                  {totalMarkets ? `${totalMarkets.toLocaleString()} markets` : `${markets.length} markets`}
                </span>
                {query && <span className="pm-pill">Filtered</span>}
                {category && <span className="pm-pill">{category}</span>}
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setState({ ...state, view: "grid" })}
                className={`pm-button pm-button-sm ${
                  view === "grid" ? "pm-button-primary" : "pm-button-ghost"
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setState({ ...state, view: "list" })}
                className={`pm-button pm-button-sm ${
                  view === "list" ? "pm-button-primary" : "pm-button-ghost"
                }`}
              >
                List
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search markets"
              className="flex-1 px-4 py-3 pm-input text-sm"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-3 pm-button pm-button-primary"
            >
              Search
            </button>
          </div>
        </div>

        {/* Markets Grid */}
        <div className="p-6">
          {markets.length === 0 ? (
            <div className="text-center py-10">
              <div className="inline-flex mb-3">
                <span className="pm-pill">No Results</span>
              </div>
              <h3 className="text-lg font-semibold mb-1">No markets found</h3>
              <button
                onClick={() => sendFollowUpMessage("Show me trending markets")}
                className="mt-4 px-6 py-2 pm-button pm-button-primary"
              >
                View Trending
              </button>
            </div>
          ) : (
            <div className={`${view === "grid" ? "grid grid-cols-2 gap-4" : "space-y-3"} pm-stagger`}>
              {markets.map((market) => (
                <MarketCard
                  key={market.id}
                  market={market}
                  onClick={() => handleMarketClick(market)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-default bg-surface/50">
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => sendFollowUpMessage("Show me recent markets")}
              className="px-6 py-2 pm-button pm-button-secondary"
            >
              Recent
            </button>
            <button
              onClick={() => sendFollowUpMessage("Show me trending markets")}
              className="px-6 py-2 pm-button pm-button-primary"
            >
              Trending
            </button>
          </div>
        </div>
      </div>
    </McpUseProvider>
  );
};

export default MarketExplorer;
