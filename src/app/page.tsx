import Link from "next/link";

import { getCatalogSummary } from "@/features/catalog/catalog.queries";

export default function HomePage() {
  const summary = getCatalogSummary();

  return (
    <>
      <section className="hero">
        <p className="eyebrow">ANthurium breeding archive</p>
        <h1>개체의 출처부터 자손의 계보까지</h1>
        <p>
          원종과 알려진 하이브리드를 살펴보고, 실제 보유 개체의 성장·교배·
          증식 이력을 한곳에서 기록합니다.
        </p>
        <div className="hero-actions">
          <Link className="button primary" href="/catalog">
            공개 도감 보기
          </Link>
          <Link className="button secondary" href="/specimens">
            보유 개체 보기
          </Link>
        </div>
      </section>

      <section className="summary-grid" aria-label="도감 현황">
        <article>
          <strong>{summary.total}</strong>
          <span>전체 노드</span>
        </article>
        <article>
          <strong>{summary.species}</strong>
          <span>원종</span>
        </article>
        <article>
          <strong>{summary.selection}</strong>
          <span>선별종</span>
        </article>
        <article>
          <strong>{summary.hybrid}</strong>
          <span>하이브리드</span>
        </article>
      </section>
    </>
  );
}
