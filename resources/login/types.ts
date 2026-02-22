import { z } from "zod";

export const propSchema = z.object({
  loginStatus: z.enum(["pending", "connected", "error"]).describe("Current login status"),
  walletAddress: z.string().optional().describe("Connected wallet address"),
  errorMessage: z.string().optional().describe("Error message if login failed"),
});

export type LoginProps = z.infer<typeof propSchema>;

export type LoginState = {
  apiKey?: string;
  apiSecret?: string;
  apiPassphrase?: string;
  walletAddress?: string;
  isConnected: boolean;
};
