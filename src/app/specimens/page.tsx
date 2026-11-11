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
    <>
      <section className="index-hero">
        <div className="container index-hero-grid">
          <div>
            <h1>보유 개체</h1>
            <p className="lead">
              도감의 종·하이브리드 정보와 별개로, 실제 화분 단위로 사진과 출처
              증빙을 모았습니다. 계통은 라벨·판매자 자료에 적힌 내용만
              기록합니다.
            </p>
          </div>
          <dl className="facts facts--figures" aria-label="보유 현황">
            <div>
              <dt>보유 개체</dt>
              <dd>{summary.total}</dd>
            </div>
            <div>
              <dt>출처 증빙 있음</dt>
              <dd className="figure--signal">{summary.documented}</dd>
            </div>
            <div>
              <dt>판매자 사진만</dt>
              <dd>{summary.photo}</dd>
            </div>
            <div>
              <dt>보유 사진</dt>
              <dd>{summary.photoCount}</dd>
            </div>
          </dl>
        </div>
      </section>
      <section className="guide">
        <div className="container">
          <ol className="plates">
            {specimens.map((specimen) => (
              <SpecimenCard
                key={specimen.id}
                specimen={specimen}
                trackingCount={trackingCounts.get(specimen.id)}
              />
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
