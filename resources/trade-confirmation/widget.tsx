import { McpUseProvider, useWidget, type WidgetMetadata } from "mcp-use/react";
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
  const {
    props,
    isPending,
    state,
    setState,
    sendFollowUpMessage,
  } = useWidget<TradeConfirmationProps, TradeConfirmationState>();

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

  const { marketTitle, side, action, amount, price, estimatedShares, potentialProfit } = props;
  const currentState = state?.status || "pending";

  const handleConfirmTrade = () => {
    setState({ status: "executing" });

    // Simulate trade execution
    setTimeout(() => {
      setState({
        status: "success",
        transactionHash: "0x" + Math.random().toString(16).slice(2, 18),
      });

      sendFollowUpMessage(
        `Trade executed successfully! Bought ${estimatedShares.toFixed(2)} shares of ${side} at ${Math.round(price * 100)}¢. Check your portfolio to see the position.`
      );
    }, 1500);
  };

  const handleCancel = () => {
    sendFollowUpMessage("Trade cancelled. What would you like to do next?");
  };

  // Success state
  if (currentState === "success") {
    return (
      <McpUseProvider>
        <div className="pm-frame">
          <div className="pm-header pm-compact">
            <div className="pm-row">
              <div>
                <div className="pm-kicker mb-2">Trade Executed</div>
                <h2 className="text-2xl font-semibold text-white">Success! ✓</h2>
              </div>
              <span className="pm-pill">Complete</span>
            </div>
          </div>

          <div className="pm-compact">
            <div className="pm-panel p-4 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-3xl">✅</div>
                <div>
                  <p className="text-sm font-medium mb-1">Trade Confirmed</p>
                  <p className="text-xs text-secondary">Your position has been updated</p>
                </div>
              </div>

              {state?.transactionHash && (
                <div className="text-xs text-secondary font-mono">
                  TX: {state.transactionHash}
                </div>
              )}
            </div>

            <div className="pm-row">
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

  // Executing state
  if (currentState === "executing") {
    return (
      <McpUseProvider>
        <div className="pm-frame pm-compact">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent mb-4"></div>
            <p className="text-sm text-secondary">Executing trade...</p>
          </div>
        </div>
      </McpUseProvider>
    );
  }

  // Confirmation state
  const sideColor = side === "YES" ? "text-accent" : "text-negative";
  const actionColor = action === "BUY" ? "border-accent" : "border-negative";
  const isDemoMode = true; // TODO: Check if real credentials are configured

  return (
    <McpUseProvider>
      <div className="pm-frame">
        {/* Header */}
        <div className="pm-header pm-compact">
          <div className="pm-row">
            <div>
              <div className="pm-kicker mb-2">⚠️ CONFIRMATION REQUIRED</div>
              <h2 className="text-xl font-semibold text-white">Review Your Order</h2>
            </div>
            <span className={`pm-pill border ${actionColor}`}>
              {action} {side}
            </span>
          </div>
        </div>

        {/* Market Info */}
        <div className="px-6 pt-5">
          <div className="pm-panel p-4 mb-4">
            <div className="pm-meta mb-2">📊 MARKET</div>
            <p className="text-sm font-medium mb-3">{marketTitle}</p>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-secondary text-xs mb-1">Outcome</div>
                <div className={`font-semibold ${sideColor} text-lg`}>{side}</div>
              </div>
              <div>
                <div className="text-secondary text-xs mb-1">Current Price</div>
                <div className="font-semibold text-lg">{Math.round(price * 100)}¢</div>
              </div>
            </div>
          </div>
        </div>

        {/* Trade Details */}
        <div className="px-6 pb-5">
          <div className="pm-panel p-4 mb-4">
            <div className="pm-meta mb-3">💰 ORDER SUMMARY</div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary">You Pay</span>
                <span className="font-semibold text-lg text-white">${amount.toFixed(2)} USD</span>
              </div>

              <div className="flex justify-between">
                <span className="text-secondary">You Receive</span>
                <span className="font-semibold text-lg text-white">{estimatedShares.toFixed(2)} shares</span>
              </div>

              <div className="border-t border-default pt-3">
                <div className="flex justify-between mb-1">
                  <span className="text-secondary text-xs">If {side} wins:</span>
                  <span className="font-semibold text-accent text-sm">
                    +${potentialProfit.toFixed(2)} profit
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary text-xs">If {side} loses:</span>
                  <span className="font-semibold text-negative text-sm">
                    -${amount.toFixed(2)} loss
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Warning Banner */}
          <div className={`pm-panel p-4 mb-4 ${isDemoMode ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">{isDemoMode ? '🎭' : '⚠️'}</span>
              <div className="text-xs">
                {isDemoMode ? (
                  <>
                    <p className="font-bold text-yellow-400 mb-1">DEMO MODE</p>
                    <p className="text-secondary">This is a simulated trade. No real funds will be used.</p>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-red-400 mb-1">REAL MONEY TRADE</p>
                    <p className="text-secondary">This will execute a real trade using your funds. You may lose your entire investment.</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Confirmation Checklist */}
          <div className="pm-panel p-4 mb-4">
            <div className="text-xs text-secondary space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-accent">✓</span>
                <span>I understand this is {isDemoMode ? 'a simulated' : 'a real'} trade</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent">✓</span>
                <span>I have reviewed the market question and outcome</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent">✓</span>
                <span>I accept the potential loss of ${amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleConfirmTrade}
              className={`flex-1 px-5 py-3 font-bold rounded-lg transition-all text-sm ${
                isDemoMode
                  ? 'bg-accent hover:bg-accent-strong text-black'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {isDemoMode ? '✓ Confirm Demo Trade' : '⚠️ Execute Real Trade'}
            </button>
            <button
              onClick={handleCancel}
              className="px-5 py-3 pm-button pm-button-secondary font-semibold text-sm"
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
