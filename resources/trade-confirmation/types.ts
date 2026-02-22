import { z } from "zod";

export const propSchema = z.object({
  marketTitle: z.string().describe("The market question/title"),
  side: z.enum(["YES", "NO"]).describe("Which outcome to trade"),
  action: z.enum(["BUY", "SELL"]).describe("Buy or sell action"),
  amount: z.number().describe("Amount in USD"),
  price: z.number().describe("Current price (0-1)"),
  estimatedShares: z.number().describe("Estimated shares to receive"),
  potentialProfit: z.number().describe("Potential profit if outcome wins"),
  tokenId: z.string().optional().describe("CLOB token ID"),
});

export type TradeConfirmationProps = z.infer<typeof propSchema>;

export type TradeConfirmationState = {
  status: "pending" | "confirming" | "executing" | "success" | "error";
  errorMessage?: string;
  transactionHash?: string;
};
