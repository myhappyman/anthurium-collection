import type { Metadata } from "next";

import { CatalogCard } from "@/features/catalog/components/catalog-card";
import { getCatalogNodes } from "@/features/catalog/catalog.queries";

export const metadata: Metadata = {
  title: "공개 도감",
  description: "안스리움 원종, 선별종과 하이브리드 도감입니다.",
};

export default function CatalogPage() {
  const nodes = getCatalogNodes();

  return (
    <section className="page-section">
      <div className="page-heading">
        <p className="eyebrow">PUBLIC CATALOG</p>
        <h1>안스리움 도감</h1>
        <p>기존 정적 도감 데이터를 타입 안전한 공개 페이지로 이전했습니다.</p>
      </div>
      <div className="catalog-grid">
        {nodes.map((node) => (
          <CatalogCard key={node.id} node={node} />
        ))}
      </div>
    </section>
  );
}
