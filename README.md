# Polymarket MCP App

Deployed on mcp-use cloud: `https://cold-meadow-fkl7v.run.mcp-use.com/mcp`

Polymarket MCP is a minimalist, high‑signal market companion that lets you discover, inspect, and reason about prediction markets inside a clean MCP UI. It’s designed for judges to grasp what’s happening at a glance: a landscape, bar‑style interface with live market data, fast search, and a focused market detail view.

Betting through AI agents is the future — this app is the first step toward that workflow: ask for context, fetch markets, and act on signals without leaving the conversation.

This MCP server project was bootstrapped with [`create-mcp-use-app`](https://mcp-use.com/docs/typescript/getting-started/quickstart).

## What It Does

- **Trending markets**: top markets surfaced by real activity.
- **Recent markets**: newest events as they go live.
- **Keyword search**: find markets by topic or phrase (not just slugs).
- **Market detail**: clear YES/NO pricing + price history chart.
- **Portfolio widget**: compact view for positions (ready for real data wiring).

## Example Prompts

Use these directly in the inspector or your agent:

1. `Show me trending markets`
2. `Show me recent markets`
3. `Search markets for: bitcoin`
4. `Search markets for: movies`
5. `Show me detailed chart for market/<market-slug>`
6. `Show me detailed chart for: Will X happen by Y?`

Tip: clicking a market card will pass the slug automatically for precise detail views.

## Getting Started

First, run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000/inspector](http://localhost:3000/inspector) with your browser to test your server.

You can start building by editing the entry file. Add tools, resources, and prompts — the server auto-reloads as you edit.

## Learn More

To learn more about mcp-use and MCP:

- [mcp-use Documentation](https://mcp-use.com/docs/typescript/getting-started/quickstart) — guides, API reference, and tutorials

## Deploy on Manufact Cloud

```bash
npm run deploy
```
