import type { Metadata } from "next";

import { getCatalogNodes } from "@/features/catalog/catalog.queries";
import { LineageCanvasLoader } from "@/features/lineage/components/lineage-canvas-loader";

export const metadata: Metadata = {
  title: "공개 도감 계보",
  description: "안스리움 원종, 선별종, 하이브리드의 교배와 선별 관계를 한 장의 계보로 봅니다.",
};

export default function LineagePage() {
  const nodes = getCatalogNodes().map((node) => ({
    id: node.id,
    displayName: node.displayName,
    scientificName: node.scientificName,
    type: node.type,
    parents: node.parents,
    selectionOf: node.selectionOf,
  }));

  return (
    <section className="tool">
      <div className="container tool-head">
        <h1>공개 도감 계보</h1>
        <p>실선은 교배, 점선은 선별 관계입니다.</p>
      </div>
      <div className="container">
        <LineageCanvasLoader nodes={nodes} />
      </div>
    </section>
  );
}
