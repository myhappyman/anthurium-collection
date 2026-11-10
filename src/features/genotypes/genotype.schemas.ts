import { z } from "zod";

export const genotypeKindSchema = z.enum([
  "species",
  "named_clone",
  "hybrid",
  "selfed_seedling",
  "cross_seedling",
  "selected_seedling",
  "reference_only",
  "unknown",
]);

export const provenanceGradeSchema = z.enum(["A", "B", "C", "D", "U"]);
export const visibilitySchema = z.enum(["private", "unlisted", "public"]);

export const createGenotypeSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9][A-Z0-9-]{2,39}$/, "코드 형식을 확인해주세요."),
  displayName: z.string().trim().min(1).max(120),
  kind: genotypeKindSchema,
  generation: z.string().trim().max(20).optional(),
  breederName: z.string().trim().max(120).optional(),
  provenanceGrade: provenanceGradeSchema,
  provenanceNotes: z.string().trim().max(2000).optional(),
  visibility: visibilitySchema,
});

export type CreateGenotypeInput = z.infer<typeof createGenotypeSchema>;
