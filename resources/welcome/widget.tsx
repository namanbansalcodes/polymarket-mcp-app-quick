import { McpUseProvider, useWidget, type WidgetMetadata } from "mcp-use/react";
import React from "react";
import "../styles.css";
import type { WelcomeProps } from "./types";
import { propSchema } from "./types";

export const widgetMetadata: WidgetMetadata = {
  description: "Welcome and onboarding experience for Polymarket MCP",
  props: propSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: false,
    invoking: "Loading...",
    invoked: "Welcome!",
  },
};

const Welcome: React.FC = () => {
  const { isPending, sendFollowUpMessage } = useWidget<WelcomeProps>();

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

  const features = ["Explore", "Charts", "AI Analysis", "Live Data"];

  return (
    <McpUseProvider>
      <div className="pm-frame">
        <div className="pm-header pm-compact">
          <div className="pm-row">
            <div>
              <div className="pm-kicker mb-2">Polymarket MCP</div>
              <h1 className="text-2xl font-semibold text-white">
                Prediction markets, distilled
              </h1>
            </div>
            <button
              onClick={() => sendFollowUpMessage("Show me trending markets")}
              className="pm-button pm-button-primary px-5 py-2"
            >
              Explore Markets
            </button>
          </div>
        </div>

        <div className="pm-compact">
          <div className="flex flex-wrap gap-2">
            {features.map((feature) => (
              <span key={feature} className="pm-pill">
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>
    </McpUseProvider>
  );
};

export default Welcome;
