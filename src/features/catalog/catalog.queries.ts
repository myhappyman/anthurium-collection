import catalogJson from "../../../data/taxa.json";

import {
  catalogDataSchema,
  type CatalogNode,
  type CatalogNodeType,
} from "./catalog.types";

const catalogData = catalogDataSchema.parse(catalogJson);
const catalogNodes = catalogData.taxa;
const catalogNodeById = new Map(
  catalogNodes.map((node) => [node.id, node] as const),
);

type CatalogSummary = Record<CatalogNodeType, number> & {
  total: number;
};

export function getCatalogNodes(): readonly CatalogNode[] {
  return catalogNodes;
}

export function getCatalogNode(id: string): CatalogNode | undefined {
  return catalogNodeById.get(id);
}

export function getCatalogSummary(): CatalogSummary {
  const summary: CatalogSummary = {
    total: catalogNodes.length,
    species: 0,
    selection: 0,
    hybrid: 0,
  };

  for (const node of catalogNodes) {
    summary[node.type] += 1;
  }

  return summary;
}
