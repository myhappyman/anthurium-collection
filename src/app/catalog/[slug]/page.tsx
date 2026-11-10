import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getCatalogNode,
  getCatalogNodes,
} from "@/features/catalog/catalog.queries";
import { CATALOG_TYPE_LABELS } from "@/features/catalog/catalog.types";

type CatalogDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return getCatalogNodes().map((node) => ({ slug: node.id }));
}

export async function generateMetadata({
  params,
}: CatalogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const node = getCatalogNode(slug);

  if (!node) {
    return { title: "개체를 찾을 수 없음" };
  }

  return {
    title: node.displayName,
    description: node.descriptionKo ?? `${node.displayName} 도감 정보`,
  };
}

export default async function CatalogDetailPage({
  params,
}: CatalogDetailPageProps) {
  const { slug } = await params;
  const node = getCatalogNode(slug);

  if (!node) {
    notFound();
  }

  const parents = node.parents
    .map((parentId) => getCatalogNode(parentId))
    .filter((parent) => parent !== undefined);

  return (
    <article className="detail-page">
      <Link className="back-link" href="/catalog">
        ← 도감으로
      </Link>
      <p className="eyebrow">{CATALOG_TYPE_LABELS[node.type]}</p>
      <h1>{node.displayName}</h1>
      {node.scientificName ? (
        <p className="scientific-name">{node.scientificName}</p>
      ) : null}
      <div className="chip-row">
        {node.abbreviations.map((abbreviation) => (
          <span className="chip" key={abbreviation}>
            {abbreviation}
          </span>
        ))}
        {!node.verified ? <span className="chip warning">검증 필요</span> : null}
      </div>
      {node.descriptionKo ? <p className="description">{node.descriptionKo}</p> : null}

      {parents.length > 0 ? (
        <section className="relation-section">
          <h2>교배 부모</h2>
          <div className="relation-links">
            {parents.map((parent) => (
              <Link href={`/catalog/${parent.id}`} key={parent.id}>
                {parent.displayName}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
