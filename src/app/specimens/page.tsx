import type { Metadata } from "next";

import {
  getCollectionSummary,
  getSpecimens,
} from "@/features/collection/collection.queries";
import { SpecimenCard } from "@/features/collection/components/specimen-card";
import { getTrackingCounts } from "@/features/collection/private-records";

export const metadata: Metadata = {
  title: "보유 개체",
  description: "실제로 기르고 있는 안스리움 개체와 출처 기록입니다.",
};

export default function SpecimensPage() {
  const specimens = getSpecimens();
  const summary = getCollectionSummary();
  const trackingCounts = getTrackingCounts();

  return (
    <section className="page-section">
      <div className="page-heading">
        <p className="eyebrow">MY COLLECTION</p>
        <h1>보유 개체</h1>
        <p>
          도감의 종·하이브리드 정보와 별개로, 실제 화분 단위로 사진과 출처
          증빙을 모았습니다. 계통은 라벨·판매자 자료에 적힌 내용만 기록합니다.
        </p>
      </div>
      <section className="summary-grid" aria-label="보유 현황">
        <article>
          <strong>{summary.total}</strong>
          <span>보유 개체</span>
        </article>
        <article>
          <strong>{summary.documented}</strong>
          <span>출처 증빙 있음</span>
        </article>
        <article>
          <strong>{summary.photo}</strong>
          <span>판매자 사진만</span>
        </article>
        <article>
          <strong>{summary.photoCount}</strong>
          <span>보유 사진</span>
        </article>
      </section>
      <div className="specimen-grid">
        {specimens.map((specimen) => (
          <SpecimenCard
            key={specimen.id}
            specimen={specimen}
            trackingCount={trackingCounts.get(specimen.id)}
          />
        ))}
      </div>
    </section>
  );
}
