import { z } from "zod";

export const specimenKindSchema = z.enum(["species", "hybrid", "seed"]);

/**
 * 출처 증빙 등급
 * - documented: 대화·게시물·라벨 등 문자 증빙이 있음
 * - photo: 판매자/모주 사진만 있음
 * - none: 보유 사진 외 자료 없음
 */
export const provenanceGradeSchema = z.enum(["documented", "photo", "none"]);

export const acquisitionMethodSchema = z.enum(["purchase", "gift", "trade"]);

export const acquisitionSchema = z.object({
  method: acquisitionMethodSchema.optional(),
  source: z.string().min(1),
  channel: z.string().nullable(),
  chain: z.array(z.string()),
  price: z.number().int().nonnegative().nullable(),
  note: z.string().optional(),
});

const specimenEventSchema = z.object({
  type: z.enum(["division", "repot", "note"]),
  summary: z.string().min(1),
  date: z.string().optional(),
});

export const specimenSchema = z.object({
  id: z.string().min(1),
  sourceDir: z.string().min(1),
  displayName: z.string().min(1),
  label: z.string().min(1),
  kind: specimenKindSchema,
  catalogRefs: z.array(z.string()),
  parentage: z.string().nullable(),
  provenanceGrade: provenanceGradeSchema,
  noteKo: z.string().optional(),
  events: z.array(specimenEventSchema).optional().default([]),
});

export const collectionDataSchema = z.object({
  specimens: z.array(specimenSchema),
});

const imageSchema = z.object({
  src: z.string().startsWith("/"),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  original: z.string(),
});

export const collectionImagesSchema = z.record(
  z.string(),
  z.object({
    photos: z.array(imageSchema),
  }),
);

/** private/collection-private.json — SHOW_PRIVATE_RECORDS=true 일 때만 서버에서 읽는다 */
export const privateCollectionSchema = z.object({
  records: z.record(
    z.string(),
    z.object({
      acquisition: acquisitionSchema.nullable(),
    }),
  ),
});

/** private/collection-tracking.json — 출처 증빙 이미지 매니페스트 */
export const trackingManifestSchema = z.record(z.string(), z.array(imageSchema));

export type SpecimenImage = z.infer<typeof imageSchema>;
export type SpecimenEvent = z.infer<typeof specimenEventSchema>;
export type SpecimenKind = z.infer<typeof specimenKindSchema>;
export type ProvenanceGrade = z.infer<typeof provenanceGradeSchema>;
export type SpecimenRecord = z.infer<typeof specimenSchema>;

export type Acquisition = z.infer<typeof acquisitionSchema>;

export type Specimen = SpecimenRecord & {
  photos: SpecimenImage[];
};

export type PrivateSpecimenRecord = {
  acquisition: Acquisition | null;
  tracking: SpecimenImage[];
};

export const SPECIMEN_KIND_LABELS: Record<SpecimenKind, string> = {
  species: "원종",
  hybrid: "하이브리드",
  seed: "씨앗·유묘",
};

export const SPECIMEN_EVENT_LABELS: Record<SpecimenEvent["type"], string> = {
  division: "분주",
  repot: "분갈이",
  note: "메모",
};

export const ACQUISITION_METHOD_LABELS: Record<
  z.infer<typeof acquisitionMethodSchema>,
  string
> = {
  purchase: "구매",
  gift: "나눔·증여",
  trade: "교환",
};

export const PROVENANCE_GRADE_LABELS: Record<ProvenanceGrade, string> = {
  documented: "출처 증빙 있음",
  photo: "판매자 사진만",
  none: "출처 자료 없음",
};
