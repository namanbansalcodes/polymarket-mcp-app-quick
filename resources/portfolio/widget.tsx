import { McpUseProvider, useWidget, type WidgetMetadata } from "mcp-use/react";
import React from "react";
import "../styles.css";
import type { PortfolioProps, Position } from "./types";
import { propSchema } from "./types";

export const widgetMetadata: WidgetMetadata = {
  description: "View a concise portfolio summary",
  props: propSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: false,
    invoking: "Loading portfolio...",
    invoked: "Portfolio loaded",
  },
};

const PortfolioRow: React.FC<{ position: Position }> = ({ position }) => {
  return (
    <div className="pm-panel p-3">
      <div className="pm-row">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{position.question}</div>
        </div>
        <div className="text-sm text-secondary">{position.value}</div>
      </div>
      {(position.outcome || position.pnl) && (
        <div className="pm-row mt-1 text-xs text-secondary">
          <span>{position.outcome ?? ""}</span>
          <span>{position.pnl ?? ""}</span>
        </div>
      )}
    </div>
  );
};

const Portfolio: React.FC = () => {
  const { props, isPending, sendFollowUpMessage } = useWidget<PortfolioProps>();

  if (isPending) {
    return (
      <McpUseProvider>
        <div className="pm-frame pm-compact">
          <div className="animate-pulse">
            <div className="h-6 bg-default/10 rounded w-1/3 mb-4" />
            <div className="h-4 bg-default/10 rounded w-2/3" />
          </div>
        </div>
      </McpUseProvider>
    );
  }

  const { positions, totalValue, pnl } = props;
  const displayPositions = positions.slice(0, 6);

  return (
    <McpUseProvider>
      <div className="pm-frame">
        <div className="pm-header pm-compact">
          <div className="pm-row">
            <div>
              <h2 className="text-2xl font-semibold text-white">Portfolio</h2>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              {totalValue && <span className="pm-pill">{totalValue}</span>}
              {pnl && <span className="pm-pill">{pnl}</span>}
            </div>
          </div>
        </div>

        <div className="pm-compact">
          {displayPositions.length === 0 ? (
            <div className="pm-row">
              <span className="pm-meta">No open positions</span>
              <button
                onClick={() => sendFollowUpMessage("Show me trending markets")}
                className="pm-button pm-button-primary px-4 py-2"
              >
                Explore markets
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {displayPositions.map((position) => (
                <PortfolioRow key={position.id} position={position} />
              ))}
            </div>
          )}
        </div>
      </div>
    </McpUseProvider>
  );
};

export default Portfolio;
