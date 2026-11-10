import { z } from "zod";

import {
  provenanceGradeSchema,
  visibilitySchema,
} from "@/features/genotypes/genotype.schemas";

export const createCrossSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      /^CROSS-[0-9]{4}-[0-9]{3,}$/,
      "CROSS-연도-순번 형식으로 입력해주세요.",
    ),
  seedParentGenotypeId: z.uuid().optional(),
  pollenParentGenotypeId: z.uuid().optional(),
  generation: z.string().trim().max(20).optional(),
  pollinatedAt: z.iso.date().optional(),
  notes: z.string().trim().max(3000).optional(),
  visibility: visibilitySchema,
});

export const createCrossSeedlingSchema = z.object({
  crossId: z.uuid(),
  genotypeCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9][A-Z0-9-]{2,39}$/, "유전 개체 코드를 확인해주세요."),
  displayName: z.string().trim().min(1).max(120),
  specimenCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^PLT-[0-9]{4}-[0-9]{3,}$/, "화분 코드를 확인해주세요."),
  germinatedAt: z.iso.date(),
  provenanceGrade: provenanceGradeSchema,
  visibility: visibilitySchema,
});
