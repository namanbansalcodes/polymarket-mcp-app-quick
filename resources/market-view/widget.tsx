import { McpUseProvider, useWidget, type WidgetMetadata } from "mcp-use/react";
import React from "react";
import "../styles.css";
import type { MarketViewProps } from "./types";
import { propSchema } from "./types";

export const widgetMetadata: WidgetMetadata = {
  description: "Display Polymarket prediction market data with outcome probabilities",
  props: propSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: false,
    invoking: "Loading market data...",
    invoked: "Market data loaded",
  },
};

const MarketView: React.FC = () => {
  const { props, isPending } = useWidget<MarketViewProps>();

  if (isPending) {
    return (
      <McpUseProvider>
        <div className="relative bg-surface-elevated border border-default rounded-3xl p-8">
          <div className="animate-pulse">
            <div className="h-6 bg-default/10 rounded w-3/4 mb-4" />
            <div className="h-4 bg-default/10 rounded w-1/2 mb-8" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-32 bg-default/10 rounded-2xl" />
              <div className="h-32 bg-default/10 rounded-2xl" />
            </div>
          </div>
        </div>
      </McpUseProvider>
    );
  }

  const { title, yesPrice, noPrice, volume } = props;
  const yesPercent = Math.round(yesPrice * 100);
  const noPercent = Math.round(noPrice * 100);

  return (
    <McpUseProvider>
      <div className="relative bg-surface-elevated border border-default rounded-3xl">
        {/* Header */}
        <div className="p-8 pb-6">
          <h5 className="text-secondary mb-2 uppercase tracking-wide text-xs font-medium">
            Polymarket Prediction Market
          </h5>
          <h2 className="heading-xl mb-2">{title}</h2>
          <p className="text-md text-secondary">Trading Volume: {volume}</p>
        </div>

        {/* Outcome Cards */}
        <div className="px-8 pb-8">
          <div className="grid grid-cols-2 gap-4">
            {/* YES Card */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-secondary uppercase tracking-wider">
                  YES
                </span>
              </div>
              <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                {yesPercent}¢
              </div>
              <p className="text-xs text-secondary">{yesPercent}% probability</p>

              {/* Simple progress bar */}
              <div className="mt-4 w-full h-2 bg-surface-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${yesPercent}%` }}
                />
              </div>
            </div>

            {/* NO Card */}
            <div className="bg-gradient-to-br from-rose-500/10 to-rose-600/5 border border-rose-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="text-xs font-medium text-secondary uppercase tracking-wider">
                  NO
                </span>
              </div>
              <div className="text-4xl font-bold text-rose-600 dark:text-rose-400 mb-1">
                {noPercent}¢
              </div>
              <p className="text-xs text-secondary">{noPercent}% probability</p>

              {/* Simple progress bar */}
              <div className="mt-4 w-full h-2 bg-surface-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 transition-all duration-500"
                  style={{ width: `${noPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="px-8 pb-6">
          <div className="bg-surface border border-default rounded-xl p-4">
            <p className="text-xs text-secondary">
              This is a basic placeholder widget showing Polymarket prediction market data.
              Prices represent the probability of each outcome.
            </p>
          </div>
        </div>
      </div>
    </McpUseProvider>
  );
};

export default MarketView;
