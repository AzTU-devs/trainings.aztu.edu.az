import { z } from "zod";

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(160).optional().or(z.literal("")),
  body: z.string().max(5000).optional().or(z.literal("")),
});
export type ReviewInput = z.infer<typeof reviewSchema>;
