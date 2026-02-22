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
    props,
  } = useWidget<LoginProps, LoginState>();

  const [privateKey, setPrivateKey] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

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

  const handleConnect = async () => {
    if (!privateKey.trim()) {
      setError("Please enter your private key");
      return;
    }

    if (!privateKey.startsWith("0x")) {
      setError("Private key must start with 0x");
      return;
    }

    setIsSubmitting(true);
    setError("");

    // Call the login tool with the private key
    // Note: This sends the key securely to the server for this session only
    sendFollowUpMessage(`Please call the login tool with privateKey parameter set to: ${privateKey}`);

    // Optimistically update state
    setState({
      isConnected: true,
      walletAddress: "Connecting...",
    });
  };

  const handleDisconnect = () => {
    setState({
      apiKey: undefined,
      apiSecret: undefined,
      apiPassphrase: undefined,
      walletAddress: undefined,
      isConnected: false,
    });

    // Call logout tool to clear server-side session
    sendFollowUpMessage("Call the logout tool to clear my API key from the server");
  };

  const handleSkip = () => {
    sendFollowUpMessage("Show me trending markets");
  };

  // Connected state
  if (props.loginStatus === "connected" || state?.isConnected) {
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
                <div className="font-mono text-sm">{props.walletAddress || state?.walletAddress || "Connected"}</div>
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
          </div>
        </div>

        <div className="px-6 pb-6">
          {/* Error Messages */}
          {(props.errorMessage || error) && (
            <div className="pm-panel p-3 border border-red-500/30 mb-4">
              <p className="text-sm text-red-400">{props.errorMessage || error}</p>
            </div>
          )}

          {/* Private Key Input */}
          <div className="pm-panel p-4 mb-4">
            <label className="block mb-2">
              <span className="text-sm font-medium text-secondary">Private Key</span>
              <input
                type="password"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="0x..."
                className="mt-1 w-full px-3 py-2 bg-surface-elevated border border-default rounded-lg text-white placeholder-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent"
                disabled={isSubmitting}
              />
            </label>
            <p className="text-xs text-secondary mt-2">
              ⚠️ Your private key is sent securely and stored only in this session
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleConnect}
              disabled={isSubmitting || !privateKey.trim()}
              className="pm-button pm-button-primary px-5 py-2 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Connecting..." : "Connect Wallet"}
            </button>
            <button
              onClick={handleSkip}
              disabled={isSubmitting}
              className="pm-button pm-button-ghost px-4 py-2"
            >
              Skip
            </button>
          </div>

          {/* Info */}
          <div className="mt-4 pm-panel p-3">
            <p className="text-xs text-secondary">
              <span className="font-medium">💡 How to get your private key:</span><br />
              Export it from MetaMask or your wallet app. Never share it with anyone.
            </p>
          </div>
        </div>
      </div>
    </McpUseProvider>
  );
};

export default Login;
