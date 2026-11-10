import { z } from "zod";

import { visibilitySchema } from "@/features/genotypes/genotype.schemas";

export const mediaKindSchema = z.enum([
  "plant",
  "leaf",
  "inflorescence",
  "pollen",
  "seed",
  "provenance",
  "receipt",
  "other",
]);

export const createMediaSchema = z.object({
  specimenId: z.uuid(),
  kind: mediaKindSchema,
  capturedAt: z.iso.date().optional(),
  altText: z.string().trim().max(300).optional(),
  caption: z.string().trim().max(1000).optional(),
  visibility: visibilitySchema,
});
