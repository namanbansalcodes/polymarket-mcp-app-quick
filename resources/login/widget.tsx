import { McpUseProvider, useWidget, type WidgetMetadata } from "mcp-use/react";
import React from "react";
import "../styles.css";
import type { LoginProps, LoginState } from "./types";
import { propSchema } from "./types";

export const widgetMetadata: WidgetMetadata = {
  description: "Login and authenticate with Polymarket",
  props: propSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: false,
    invoking: "Loading login...",
    invoked: "Login ready",
  },
};

const Login: React.FC = () => {
  const {
    isPending,
    state,
    setState,
    sendFollowUpMessage,
    props: { errorMessage },
  } = useWidget<LoginProps, LoginState>();

  if (isPending) {
    return (
      <McpUseProvider>
        <div className="pm-frame pm-compact">
          <div className="animate-pulse">
            <div className="h-8 bg-default/10 rounded w-1/2 mx-auto mb-4" />
            <div className="h-4 bg-default/10 rounded w-3/4 mx-auto" />
          </div>
        </div>
      </McpUseProvider>
    );
  }

  const handleConnect = () => {
    setState({
      walletAddress: "Linked",
      isConnected: true,
    });

    // Trigger follow-up to fetch portfolio
    sendFollowUpMessage("Show my portfolio");
  };

  const handleDisconnect = () => {
    setState({
      apiKey: undefined,
      apiSecret: undefined,
      apiPassphrase: undefined,
      walletAddress: undefined,
      isConnected: false,
    });
  };

  const handleSkip = () => {
    sendFollowUpMessage("Show me trending markets");
  };

  // Connected state
  if (state?.isConnected) {
    return (
      <McpUseProvider>
        <div className="pm-frame">
          <div className="pm-header pm-compact">
            <div className="pm-row">
              <div>
                <div className="pm-kicker mb-2">Account Status</div>
                <h2 className="text-2xl font-semibold text-white">Connected</h2>
              </div>
              <span className="pm-pill">Live</span>
            </div>
          </div>

          {/* Account Info */}
          <div className="pm-compact">
            <div className="pm-row">
              <div>
                <div className="pm-meta mb-1">Wallet</div>
                <div className="font-mono text-lg">{state.walletAddress ?? "Linked"}</div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => sendFollowUpMessage("Show my portfolio")}
                  className="pm-button pm-button-primary px-5 py-2"
                >
                  View Portfolio
                </button>
                <button
                  onClick={handleDisconnect}
                  className="pm-button pm-button-secondary px-5 py-2"
                >
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        </div>
      </McpUseProvider>
    );
  }

  // Login form
  return (
    <McpUseProvider>
      <div className="pm-frame">
        {/* Header */}
        <div className="pm-header pm-compact">
          <div className="pm-row">
            <div>
              <div className="pm-kicker mb-2">Authentication</div>
              <h2 className="text-2xl font-semibold text-white">Connect to Polymarket</h2>
            </div>
            <button
              onClick={handleConnect}
              className="pm-button pm-button-primary px-5 py-2"
            >
              Connect
            </button>
          </div>
        </div>

        <div className="pm-compact">
          {errorMessage && (
            <div className="pm-panel p-3 border border-red-500/30">
              <p className="text-sm text-red-400">{errorMessage}</p>
            </div>
          )}
          <div className="pm-row">
            <p className="text-sm text-secondary">Connect to view portfolio and positions.</p>
            <button
              onClick={handleSkip}
              className="pm-button pm-button-ghost px-4 py-2"
            >
              Continue without login
            </button>
          </div>
        </div>
      </div>
    </McpUseProvider>
  );
};

export default Login;
