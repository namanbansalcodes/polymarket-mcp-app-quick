import { McpUseProvider, useWidget, useCallTool, type WidgetMetadata } from "mcp-use/react";
import React from "react";
import "../styles.css";
import type { TradeConfirmationProps, TradeConfirmationState } from "./types";
import { propSchema } from "./types";

export const widgetMetadata: WidgetMetadata = {
  description: "Confirm and execute a prediction market trade",
  props: propSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: false,
    invoking: "Preparing trade...",
    invoked: "Trade ready",
  },
};

const TradeConfirmation: React.FC = () => {
  const { props, isPending, state, setState, sendFollowUpMessage } =
    useWidget<TradeConfirmationProps, TradeConfirmationState>();

  const { callToolAsync } = useCallTool<{
    tokenId: string;
    amount: number;
    side: "YES" | "NO";
    price?: number;
    marketTitle: string;
  }>("confirm_trade_execution");

  if (isPending) {
    return (
      <McpUseProvider>
        <div className="pm-frame pm-compact">
          <div className="animate-pulse">
            <div className="h-8 bg-default/10 rounded w-3/4 mb-4" />
            <div className="h-4 bg-default/10 rounded w-1/2" />
          </div>
        </div>
      </McpUseProvider>
    );
  }

  const {
    marketTitle = "Market",
    side = "YES",
    action = "BUY",
    amount = 0,
    price = 0.5,
    estimatedShares = 0,
    potentialProfit = 0,
    tokenId = "",
    isRealTradingEnabled,
  } = props || ({} as TradeConfirmationProps);

  const currentState = state?.status || "pending";

  const handleConfirmTrade = async () => {
    setState({ status: "executing" });

    try {
      const result = await callToolAsync({
        tokenId: tokenId || "",
        amount,
        side,
        price,
        marketTitle,
      });

      const response = result?.content?.[0];
      const data: any = response?.type === "object" ? response.object : null;
      const message =
        data?.message ||
        `Mock trade executed: Bought ${side} on "${marketTitle}" for $${amount.toFixed(2)}.`;

      setState({
        status: "success",
        orderId: data?.orderId,
        transactionHash: data?.transactionHash,
        message,
      });

      sendFollowUpMessage(message);
    } catch (error: any) {
      const message = `Mock trade executed: Bought ${side} on "${marketTitle}" for $${amount.toFixed(2)}.`;
      console.error("Trade execution error:", error);
      setState({
        status: "success",
        message,
      });
      sendFollowUpMessage(message);
    }
  };

  const handleCancel = () => {
    sendFollowUpMessage("Trade cancelled. What would you like to do next?");
  };

  if (currentState === "executing") {
    return (
      <McpUseProvider>
        <div className="pm-frame pm-compact">
          <div className="pm-row">
            <div>
              <div className="pm-kicker mb-1">Trade</div>
              <h2 className="text-lg font-semibold text-white">Executing...</h2>
            </div>
            <span className="pm-pill">Processing</span>
          </div>
        </div>
      </McpUseProvider>
    );
  }

  if (currentState === "success") {
    return (
      <McpUseProvider>
        <div className="pm-frame">
          <div className="pm-header pm-compact">
            <div className="pm-row">
              <div>
                <div className="pm-kicker mb-1">Trade</div>
                <h2 className="text-xl font-semibold text-white">Mock Executed</h2>
              </div>
              <span className="pm-pill">Complete</span>
            </div>
          </div>
          <div className="pm-compact">
            <div className="pm-panel p-4">
              <p className="text-sm text-secondary">
                {state?.message ||
                  `Mock trade executed: Bought ${side} on "${marketTitle}" for $${amount.toFixed(2)}.`}
              </p>
              {state?.orderId && (
                <div className="text-xs text-secondary font-mono mt-2">
                  Order ID: {state.orderId}
                </div>
              )}
              {state?.transactionHash && (
                <div className="text-xs text-secondary font-mono mt-1">
                  TX: {state.transactionHash}
                </div>
              )}
            </div>
            <div className="pm-row mt-4">
              <button
                onClick={() => sendFollowUpMessage("Show my portfolio")}
                className="pm-button pm-button-primary px-5 py-2"
              >
                View Portfolio
              </button>
              <button
                onClick={() => sendFollowUpMessage("Show me trending markets")}
                className="pm-button pm-button-secondary px-5 py-2"
              >
                Browse Markets
              </button>
            </div>
          </div>
        </div>
      </McpUseProvider>
    );
  }

  return (
    <McpUseProvider>
      <div className="pm-frame">
        <div className="pm-header pm-compact">
          <div className="pm-row">
            <div>
              <div className="pm-kicker mb-1">Trade</div>
              <h2 className="text-xl font-semibold text-white">Mock Order</h2>
            </div>
            <span className="pm-pill">{isRealTradingEnabled ? "Real" : "Demo"}</span>
          </div>
        </div>

        <div className="pm-compact">
          <div className="pm-panel p-4 mb-4">
            <div className="pm-row">
              <div className="min-w-0">
                <div className="pm-meta mb-1">Market</div>
                <div className="text-sm font-medium truncate">{marketTitle}</div>
              </div>
              <div className="text-sm text-secondary">
                {action} {side}
              </div>
            </div>
            <div className="pm-row mt-3 text-sm">
              <span className="text-secondary">Price</span>
              <span>{Math.round(price * 100)}¢</span>
            </div>
            <div className="pm-row mt-2 text-sm">
              <span className="text-secondary">Amount</span>
              <span>${amount.toFixed(2)}</span>
            </div>
            <div className="pm-row mt-2 text-sm">
              <span className="text-secondary">Est. Shares</span>
              <span>{estimatedShares.toFixed(2)}</span>
            </div>
            <div className="pm-row mt-2 text-sm">
              <span className="text-secondary">Est. Profit</span>
              <span>${potentialProfit.toFixed(2)}</span>
            </div>
          </div>

          <div className="pm-row">
            <button
              onClick={handleConfirmTrade}
              className="pm-button pm-button-primary px-5 py-2"
            >
              Confirm Mock Trade
            </button>
            <button
              onClick={handleCancel}
              className="pm-button pm-button-secondary px-5 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </McpUseProvider>
  );
};

export default TradeConfirmation;
