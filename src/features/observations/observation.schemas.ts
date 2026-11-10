import { z } from "zod";

import { visibilitySchema } from "@/features/genotypes/genotype.schemas";

const optionalPositiveNumber = z
  .number()
  .positive()
  .optional();

export const createObservationSchema = z.object({
  specimenId: z.uuid(),
  observedAt: z.iso.date(),
  leafSequence: z.number().int().positive().optional(),
  leafLengthMm: optionalPositiveNumber,
  leafWidthMm: optionalPositiveNumber,
  petioleLengthMm: optionalPositiveNumber,
  internodeLengthMm: optionalPositiveNumber,
  emergentColor: z.string().trim().max(100).optional(),
  matureColor: z.string().trim().max(100).optional(),
  veinDescription: z.string().trim().max(500).optional(),
  sinusDescription: z.string().trim().max(500).optional(),
  texture: z.string().trim().max(200).optional(),
  vigor: z.number().int().min(1).max(5).optional(),
  notes: z.string().trim().max(3000).optional(),
  visibility: visibilitySchema,
});
