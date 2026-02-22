import { z } from "zod";

export const positionSchema = z.object({
  id: z.string(),
  question: z.string(),
  outcome: z.enum(["YES", "NO"]).optional(),
  value: z.string(),
  pnl: z.string().optional(),
});

export const propSchema = z.object({
  totalValue: z.string().optional(),
  pnl: z.string().optional(),
  positions: z.array(positionSchema),
});

export type Position = z.infer<typeof positionSchema>;
export type PortfolioProps = z.infer<typeof propSchema>;
