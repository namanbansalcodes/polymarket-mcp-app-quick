import { z } from "zod";

export const propSchema = z.object({
  userName: z.string().optional().describe("User's name if available"),
  isFirstTime: z.boolean().optional().describe("Whether this is the user's first visit"),
});

export type WelcomeProps = z.infer<typeof propSchema>;
