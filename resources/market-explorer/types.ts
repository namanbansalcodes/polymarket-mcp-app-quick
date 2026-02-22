import { z } from "zod";

export const marketSchema = z.object({
  id: z.string(),
  question: z.string(),
  slug: z.string().optional(),
  yesPrice: z.number(),
  noPrice: z.number(),
  volume: z.string(),
  category: z.string().optional(),
  image: z.string().optional(),
  description: z.string().optional(),
});

export const propSchema = z.object({
  markets: z.array(marketSchema),
  totalMarkets: z.number().optional(),
  query: z.string().optional(),
  category: z.string().optional(),
});

export type Market = z.infer<typeof marketSchema>;
export type MarketExplorerProps = z.infer<typeof propSchema>;

export type MarketExplorerState = {
  selectedMarketId?: string;
  view: "grid" | "list";
  filterCategory?: string;
};
