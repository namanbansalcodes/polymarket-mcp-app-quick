import { z } from "zod";

export const pricePointSchema = z.object({
  timestamp: z.number().describe("Unix timestamp"),
  price: z.number().describe("Price at this time (0-1)"),
});

export const propSchema = z.object({
  title: z.string().describe("The market question"),
  yesPrice: z.number().describe("YES outcome price (0-1)"),
  noPrice: z.number().describe("NO outcome price (0-1)"),
  volume: z.string().describe("Formatted trading volume"),
  priceHistory: z.array(pricePointSchema).optional().describe("Historical price data"),
});

export type PricePoint = z.infer<typeof pricePointSchema>;
export type MarketViewProps = z.infer<typeof propSchema>;
