import Link from "next/link";

import { getCatalogNode } from "../catalog.queries";
import { type CatalogNode } from "../catalog.types";

type CatalogCardProps = {
  node: CatalogNode;
};

/** 도감 행: 이름, 학명, 약칭과 선별 바탕 (field guide의 한 행) */
export function CatalogCard({ node }: CatalogCardProps) {
  const selectionBase = node.selectionOf
    ? getCatalogNode(node.selectionOf)
    : undefined;
  const line = [
    node.abbreviations.slice(0, 3).join(", "),
    selectionBase ? `${selectionBase.displayName} 선별` : "",
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <li>
      <h3 className="index-name">
        <Link href={`/catalog/${node.id}`}>{node.displayName}</Link>
      </h3>
      {node.scientificName ? (
        <p className="latin">{node.scientificName}</p>
      ) : (
        <span />
      )}
      {line ? <p className="index-line">{line}</p> : null}
    </li>
  );
}
