import { z } from "zod";

export const propSchema = z.object({
  title: z.string().describe("The market question"),
  yesPrice: z.number().describe("YES outcome price (0-1)"),
  noPrice: z.number().describe("NO outcome price (0-1)"),
  volume: z.string().describe("Formatted trading volume"),
});

export type MarketViewProps = z.infer<typeof propSchema>;
