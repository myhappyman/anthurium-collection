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

/** taxa.json 의 traits 키: 데이터에 쓰인 것만 한글 표기, 나머지는 키 그대로 */
const TRAIT_LABELS: Record<string, string> = {
  texture: "질감",
  leaf: "잎",
  origin: "원산지",
  vein: "잎맥",
  color: "색",
  newLeaf: "새잎",
  lineage: "계통",
  group: "그룹",
  petiole: "엽병",
  habit: "생육형",
  describer: "기재자",
  breeder: "브리더",
  size: "크기",
  etymology: "이름의 유래",
  creator: "작출자",
  parentage: "부모",
  flower: "꽃",
  note: "메모",
  juvenile: "유묘",
  fertility: "임성",
  distributor: "유통",
  originator: "원작출자",
  underside: "잎 뒷면",
  propagation: "증식",
  feature: "특징",
  taxonomy: "분류",
  siblings: "형제",
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
  const traits = Object.entries(node.traits ?? {});
  const selectionBase = node.selectionOf
    ? getCatalogNode(node.selectionOf)
    : undefined;

  return (
    <article className="doc">
      <div className="container">
        <Link className="back-link" href="/catalog">
          ← 도감으로
        </Link>
        <header className="doc-head">
          <div>
            <h1 className={node.displayName.length > 20 ? "display-s" : undefined}>
              {node.displayName}
            </h1>
            {node.scientificName ? (
              <p className="latin">{node.scientificName}</p>
            ) : null}
            <dl className="facts facts--stack">
              <div>
                <dt>분류</dt>
                <dd>{CATALOG_TYPE_LABELS[node.type]}</dd>
              </div>
              {selectionBase ? (
                <div>
                  <dt>선별 바탕</dt>
                  <dd>
                    <Link href={`/catalog/${selectionBase.id}`}>
                      {selectionBase.displayName}
                    </Link>
                  </dd>
                </div>
              ) : null}
              {node.abbreviations.length > 0 ? (
                <div>
                  <dt>약칭</dt>
                  <dd>{node.abbreviations.join(", ")}</dd>
                </div>
              ) : null}
              {node.aka.length > 0 ? (
                <div>
                  <dt>다른 이름</dt>
                  <dd>{node.aka.join(", ")}</dd>
                </div>
              ) : null}
              {!node.verified ? (
                <div>
                  <dt>상태</dt>
                  <dd>검증 필요</dd>
                </div>
              ) : null}
            </dl>
            {node.tags.length > 0 ? (
              <ul className="meta" aria-label="태그">
                {node.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            ) : null}
          </div>
          <div>
            {node.descriptionKo ? (
              <p className="doc-body">{node.descriptionKo}</p>
            ) : null}
            {traits.length > 0 ? (
              <dl className="facts facts--stack" aria-label="형질">
                {traits.map(([key, value]) => (
                  <div key={key}>
                    <dt>{TRAIT_LABELS[key] ?? key}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        </header>

        {parents.length > 0 ? (
          <section className="relation-section">
            <h2>교배 부모</h2>
            <ol className="index index--two">
              {parents.map((parent) => (
                <li key={parent.id}>
                  <p className="index-name">
                    <Link href={`/catalog/${parent.id}`}>
                      {parent.displayName}
                    </Link>
                  </p>
                  {parent.scientificName ? (
                    <p className="latin">{parent.scientificName}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </div>
    </article>
  );
}
