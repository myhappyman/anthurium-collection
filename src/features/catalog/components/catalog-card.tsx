import Link from "next/link";

import {
  CATALOG_TYPE_LABELS,
  type CatalogNode,
} from "../catalog.types";

type CatalogCardProps = {
  node: CatalogNode;
};

export function CatalogCard({ node }: CatalogCardProps) {
  return (
    <article className="catalog-card">
      <div className={`catalog-card-accent type-${node.type}`} />
      <p className="catalog-card-type">{CATALOG_TYPE_LABELS[node.type]}</p>
      <h2>
        <Link href={`/catalog/${node.id}`}>{node.displayName}</Link>
      </h2>
      {node.scientificName ? (
        <p className="scientific-name">{node.scientificName}</p>
      ) : null}
      <div className="chip-row">
        {node.abbreviations.slice(0, 3).map((abbreviation) => (
          <span className="chip" key={abbreviation}>
            {abbreviation}
          </span>
        ))}
      </div>
    </article>
  );
}
