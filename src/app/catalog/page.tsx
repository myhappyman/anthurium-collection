import type { Metadata } from "next";

import { CatalogCard } from "@/features/catalog/components/catalog-card";
import { getCatalogNodes } from "@/features/catalog/catalog.queries";
import {
  CATALOG_TYPE_LABELS,
  type CatalogNodeType,
} from "@/features/catalog/catalog.types";

export const metadata: Metadata = {
  title: "공개 도감",
  description: "안스리움 원종, 선별종과 하이브리드 도감입니다.",
};

const GROUP_ORDER: readonly CatalogNodeType[] = ["species", "selection", "hybrid"];

export default function CatalogPage() {
  const nodes = getCatalogNodes();

  return (
    <>
      <section className="index-hero">
        <div className="container">
          <h1>안스리움 도감</h1>
          <p className="lead">
            기존 정적 도감 데이터를 타입 안전한 공개 페이지로 이전했습니다.
          </p>
        </div>
      </section>
      <section className="guide">
        <div className="container">
          {GROUP_ORDER.map((type) => {
            const group = nodes.filter((node) => node.type === type);

            if (group.length === 0) {
              return null;
            }

            return (
              <section className="index-group" key={type}>
                <h2>{CATALOG_TYPE_LABELS[type]}</h2>
                <ol className="index">
                  {group.map((node) => (
                    <CatalogCard key={node.id} node={node} />
                  ))}
                </ol>
              </section>
            );
          })}
        </div>
      </section>
    </>
  );
}
