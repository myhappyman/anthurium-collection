import { getCatalogNodes } from "@/features/catalog/catalog.queries";
import { LineageCanvasLoader } from "@/features/lineage/components/lineage-canvas-loader";

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
    <section className="lineage-page">
      <div className="lineage-heading">
        <div>
          <p className="eyebrow">LINEAGE CANVAS</p>
          <h1>공개 도감 계보</h1>
        </div>
        <p>파랑은 교배, 보라는 선별 관계입니다.</p>
      </div>
      <LineageCanvasLoader nodes={nodes} />
    </section>
  );
}
