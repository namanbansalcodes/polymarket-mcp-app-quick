import { McpUseProvider, useWidget, type WidgetMetadata } from "mcp-use/react";
import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import "../styles.css";
import type { MarketViewProps, PricePoint } from "./types";
import { propSchema } from "./types";

export const widgetMetadata: WidgetMetadata = {
  description: "Display Polymarket prediction market data with price charts",
  props: propSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: false,
    invoking: "Loading market data...",
    invoked: "Market data loaded",
  },
};

const PriceChart: React.FC<{
  data: PricePoint[];
  title: string;
  sendFollowUpMessage: (message: string) => void;
}> = ({ data, title, sendFollowUpMessage }) => {
  if (!data || data.length === 0) {
    return (
      <div className="pm-panel p-6 text-center">
        <p className="text-sm text-secondary">No price history available</p>
      </div>
    );
  }

  // Prepare data for Recharts
  const chartData = data
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(d => ({
      time: d.timestamp * 1000, // Convert to milliseconds
      price: d.price * 100, // Convert to cents
      priceRaw: d.price,
    }));

  // Format time for X-axis
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = Date.now();
    const hoursDiff = (now - timestamp) / (1000 * 60 * 60);

    if (hoursDiff < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-surface border border-default rounded-lg p-2 shadow-lg">
          <p className="text-xs text-accent font-bold">{data.price.toFixed(1)}¢</p>
          <p className="text-[10px] text-secondary">
            {new Date(data.time).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="pm-panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider">Price History</h4>
        <div className="flex items-center gap-2">
          <span className="text-xs text-secondary">{chartData.length} data points</span>
          <button
            onClick={() => sendFollowUpMessage(`Refresh market data for: ${title}`)}
            className="text-xs px-2 py-1 rounded bg-surface hover:bg-surface-elevated border border-default text-accent transition-colors"
            title="Refresh prices"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div style={{ width: '100%', height: 200 }}>
        <ResponsiveContainer>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="rgb(16, 185, 129)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="rgb(16, 185, 129)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              tickFormatter={formatTime}
              stroke="rgba(255,255,255,0.3)"
              style={{ fontSize: '10px' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={['dataMin - 2', 'dataMax + 2']}
              tickFormatter={(value) => `${value.toFixed(0)}¢`}
              stroke="rgba(255,255,255,0.3)"
              style={{ fontSize: '10px' }}
              tickLine={false}
              axisLine={false}
              width={35}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke="rgb(16, 185, 129)"
              strokeWidth={2.5}
              fill="url(#colorPrice)"
              animationDuration={800}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const MarketView: React.FC = () => {
  const { props, isPending, sendFollowUpMessage } = useWidget<MarketViewProps>();

  if (isPending) {
    return (
      <McpUseProvider>
        <div className="pm-frame pm-compact">
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

  const { title, yesPrice, noPrice, volume, priceHistory } = props;
  const yesPercent = Math.round(yesPrice * 100);
  const noPercent = Math.round(noPrice * 100);

  return (
    <McpUseProvider>
      <div className="pm-frame">
        {/* Header */}
        <div className="pm-header pm-compact">
          <div className="pm-row">
            <div>
              <div className="pm-kicker mb-1">Market</div>
              <h2 className="heading-xl">{title}</h2>
            </div>
            <span className="pm-pill">{volume}</span>
          </div>
        </div>

        {/* Price Chart */}
        {priceHistory && priceHistory.length > 0 && (
          <div className="px-6 pb-5">
            <PriceChart
              data={priceHistory}
              title={title}
              sendFollowUpMessage={sendFollowUpMessage}
            />
          </div>
        )}

        {/* Outcome Cards */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-2 gap-3">
            {/* YES Card */}
            <div className="pm-card pm-card-yes p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="pm-dot pm-dot-yes" />
                <span className="text-[11px] font-medium text-secondary uppercase tracking-wider">
                  YES
                </span>
              </div>
              <div className="text-2xl font-semibold pm-stat mb-1">
                {yesPercent}¢
              </div>
              <p className="text-[11px] text-secondary">{yesPercent}% probability</p>

              <div className="mt-3 pm-progress">
                <span style={{ width: `${yesPercent}%` }} />
              </div>

              {/* Buy YES Button */}
              <button
                onClick={() => sendFollowUpMessage(`Execute a trade using execute_trade tool with these parameters:
Market: "${title}"
Side: YES
Amount: 100
Price: ${yesPrice.toFixed(3)}
Please call the execute_trade tool now.`)}
                className="mt-3 w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-all text-sm"
              >
                Buy YES ($100)
              </button>
            </div>

            {/* NO Card */}
            <div className="pm-card pm-card-no p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="pm-dot pm-dot-no" />
                <span className="text-[11px] font-medium text-secondary uppercase tracking-wider">
                  NO
                </span>
              </div>
              <div className="text-2xl font-semibold pm-stat mb-1">
                {noPercent}¢
              </div>
              <p className="text-[11px] text-secondary">{noPercent}% probability</p>

              <div className="mt-3 pm-progress pm-progress-negative">
                <span style={{ width: `${noPercent}%` }} />
              </div>

              {/* Buy NO Button */}
              <button
                onClick={() => sendFollowUpMessage(`Execute a trade using execute_trade tool with these parameters:
Market: "${title}"
Side: NO
Amount: 100
Price: ${noPrice.toFixed(3)}
Please call the execute_trade tool now.`)}
                className="mt-3 w-full px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg transition-all text-sm"
              >
                Buy NO ($100)
              </button>
            </div>
          </div>
        </div>

        {/* Trading Actions Info */}
        <div className="px-6 pb-6">
          <div className="pm-panel p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div className="text-xs text-secondary">
                <p className="font-medium mb-1">Click a button to analyze your trade</p>
                <p>Claude will explain the market dynamics, assess risk, and help you understand the potential outcomes before trading.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </McpUseProvider>
  );
};

export default MarketView;
