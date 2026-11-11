import Link from "next/link";

import { type CatalogNode } from "../catalog.types";

type CatalogCardProps = {
  node: CatalogNode;
};

/** 도감 행: 이름, 학명, 약칭 (field guide의 한 행) */
export function CatalogCard({ node }: CatalogCardProps) {
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
      {node.abbreviations.length > 0 ? (
        <p className="index-line">{node.abbreviations.slice(0, 3).join(", ")}</p>
      ) : null}
    </li>
  );
}
