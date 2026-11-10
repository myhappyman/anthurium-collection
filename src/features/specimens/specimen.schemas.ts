import { z } from "zod";

import { visibilitySchema } from "@/features/genotypes/genotype.schemas";

export const propagationMethodSchema = z.enum([
  "seed",
  "offset",
  "division",
  "stem_cut",
  "tissue_culture",
]);

export const createSpecimenSchema = z.object({
  genotypeId: z.uuid(),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^PLT-[0-9]{4}-[0-9]{3,}$/, "PLT-연도-순번 형식으로 입력해주세요."),
  propagationMethod: propagationMethodSchema,
  acquiredAt: z.iso.date().optional(),
  startedAt: z.iso.date().optional(),
  visibility: visibilitySchema,
});

export const createPropagationSchema = z.object({
  sourceSpecimenId: z.uuid(),
  targetCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^PLT-[0-9]{4}-[0-9]{3,}$/, "PLT-연도-순번 형식으로 입력해주세요."),
  method: z.enum(["offset", "division", "stem_cut", "tissue_culture"]),
  propagatedAt: z.iso.date(),
  visibility: visibilitySchema,
  notes: z.string().trim().max(2000).optional(),
  consumeSource: z.boolean(),
});

export const specimenStatusSchema = z.enum([
  "active",
  "reserved",
  "listed",
  "sold",
  "transferred",
  "consumed",
  "died",
  "lost",
]);

export const changeSpecimenStatusSchema = z.object({
  specimenId: z.uuid(),
  status: specimenStatusSchema,
  occurredOn: z.iso.date(),
  notes: z.string().trim().max(2000).optional(),
  transactionKind: z
    .enum(["sale", "gift_sent", "trade"])
    .optional(),
  counterparty: z.string().trim().max(200).optional(),
  amount: z.number().nonnegative().optional(),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "통화는 영문 3자리로 입력해주세요.")
    .optional(),
});
