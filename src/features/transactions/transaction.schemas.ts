import { z } from "zod";

export const createTransactionSchema = z.object({
  specimenId: z.uuid(),
  kind: z.enum(["purchase", "sale", "gift_received", "gift_sent", "trade"]),
  transactedAt: z.iso.date(),
  counterparty: z.string().trim().max(200).optional(),
  amount: z.number().nonnegative().optional(),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/)
    .optional(),
  notes: z.string().trim().max(3000).optional(),
});
