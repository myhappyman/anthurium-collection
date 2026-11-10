import { z } from "zod";

export const catalogNodeTypeSchema = z.enum([
  "species",
  "selection",
  "hybrid",
]);

const catalogTraitsSchema = z.record(z.string(), z.string());

export const catalogNodeSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  scientificName: z.string().nullable(),
  type: catalogNodeTypeSchema,
  abbreviations: z.array(z.string()),
  parents: z.array(z.string()),
  selectionOf: z.string().optional(),
  aka: z.array(z.string()).optional().default([]),
  descriptionKo: z.string().optional(),
  traits: catalogTraitsSchema.optional(),
  tags: z.array(z.string()).optional().default([]),
  images: z.array(z.string()).optional().default([]),
  sources: z.array(z.string()).optional().default([]),
  verified: z.boolean().optional().default(false),
});

export const catalogDataSchema = z.object({
  taxa: z.array(catalogNodeSchema),
});

export type CatalogNode = z.infer<typeof catalogNodeSchema>;
export type CatalogNodeType = z.infer<typeof catalogNodeTypeSchema>;

export const CATALOG_TYPE_LABELS: Record<CatalogNodeType, string> = {
  species: "원종",
  selection: "선별종",
  hybrid: "하이브리드",
};
