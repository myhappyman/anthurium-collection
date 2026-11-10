import collectionJson from "../../../data/collection.json";
import collectionImagesJson from "../../../data/collection-images.json";

import {
  collectionDataSchema,
  collectionImagesSchema,
  type ProvenanceGrade,
  type Specimen,
} from "./collection.types";

const collectionData = collectionDataSchema.parse(collectionJson);
const collectionImages = collectionImagesSchema.parse(collectionImagesJson);

const specimens: readonly Specimen[] = collectionData.specimens.map((record) => {
  const images = collectionImages[record.id];

  return {
    ...record,
    photos: images?.photos ?? [],
  };
});

const specimenById = new Map(
  specimens.map((specimen) => [specimen.id, specimen] as const),
);

export function getSpecimens(): readonly Specimen[] {
  return specimens;
}

export function getSpecimen(id: string): Specimen | undefined {
  return specimenById.get(id);
}

type CollectionSummary = Record<ProvenanceGrade, number> & {
  total: number;
  photoCount: number;
};

export function getCollectionSummary(): CollectionSummary {
  const summary: CollectionSummary = {
    total: specimens.length,
    photoCount: 0,
    documented: 0,
    photo: 0,
    none: 0,
  };

  for (const specimen of specimens) {
    summary[specimen.provenanceGrade] += 1;
    summary.photoCount += specimen.photos.length;
  }

  return summary;
}
