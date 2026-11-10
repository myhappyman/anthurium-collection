import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ActivityTimeline,
  type TimelineItem,
} from "@/features/activity/components/activity-timeline";
import { getOwnedGenotypeDetails } from "@/features/genotypes/genotype.queries";

type GenotypeDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function GenotypeDetailPage({
  params,
}: GenotypeDetailPageProps) {
  const { id } = await params;
  const details = await getOwnedGenotypeDetails(id);

  if (!details) {
    notFound();
  }

  const activityItems: TimelineItem[] = details.activityEvents.map((event) => ({
    id: event.id,
    occurredAt: event.occurred_at,
    label: event.kind,
    detail: event.notes,
    category: "activity",
  }));

  return (
    <section className="dashboard-page">
      <Link className="back-link" href="/dashboard/genotypes">
        ← 유전 개체 목록
      </Link>
      <div className="dashboard-heading with-action">
        <div>
          <p className="eyebrow">{details.genotype.code}</p>
          <h1>{details.genotype.display_name}</h1>
          <p>
            {details.genotype.kind} · 출처 등급{" "}
            {details.genotype.provenance_grade}
          </p>
        </div>
        <div className="record-meta">
          {details.genotype.generation ? (
            <span>{details.genotype.generation}</span>
          ) : null}
          <span>{details.genotype.visibility}</span>
          <span>사진 {details.media.length}</span>
        </div>
      </div>

      <div className="summary-grid">
        <article className="summary-card">
          <span>실물 화분</span>
          <strong>{details.specimens.length}</strong>
        </article>
        <article className="summary-card">
          <span>부모로 참여한 교배</span>
          <strong>{details.parentCrosses.length}</strong>
        </article>
        <article className="summary-card">
          <span>발생 교배</span>
          <strong>{details.originCross ? 1 : 0}</strong>
        </article>
      </div>

      {details.genotype.provenance_notes ? (
        <section className="relation-section">
          <h2>출처 메모</h2>
          <p className="description">{details.genotype.provenance_notes}</p>
        </section>
      ) : null}

      {details.originCross ? (
        <section className="relation-section">
          <h2>이 개체가 나온 교배</h2>
          <Link
            className="relation-card"
            href={`/dashboard/crosses/${details.originCross.id}`}
          >
            <strong>{details.originCross.code}</strong>
            <span>
              {details.originCross.generation ?? "세대 미기록"} ·{" "}
              {details.originCross.status}
            </span>
          </Link>
        </section>
      ) : null}

      <section className="relation-section">
        <h2>동일 유전 개체의 화분</h2>
        {details.specimens.length === 0 ? (
          <div className="record-empty">
            <strong>연결된 실물 화분이 없습니다.</strong>
          </div>
        ) : (
          <div className="record-list">
            {details.specimens.map((specimen) => (
              <article key={specimen.id}>
                <div>
                  <span>{specimen.code}</span>
                  <h2>
                    <Link href={`/dashboard/specimens/${specimen.id}`}>
                      {specimen.status}
                    </Link>
                  </h2>
                </div>
                <div className="record-meta">
                  <span>{specimen.propagation_method}</span>
                  <span>{specimen.visibility}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {details.parentCrosses.length > 0 ? (
        <section className="relation-section">
          <h2>이 개체가 부모로 참여한 교배</h2>
          <div className="relation-links">
            {details.parentCrosses.map((cross) => (
              <Link
                className="chip"
                href={`/dashboard/crosses/${cross.id}`}
                key={cross.id}
              >
                {cross.code} · {cross.status}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {activityItems.length > 0 ? (
        <section className="relation-section">
          <h2>개체 활동 이력</h2>
          <ActivityTimeline items={activityItems} />
        </section>
      ) : null}
    </section>
  );
}
