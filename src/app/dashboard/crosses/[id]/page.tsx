import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ActivityTimeline,
  type TimelineItem,
} from "@/features/activity/components/activity-timeline";
import { getOwnedCrossDetails } from "@/features/crosses/cross.queries";

type CrossDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CrossDetailPage({
  params,
}: CrossDetailPageProps) {
  const { id } = await params;
  const details = await getOwnedCrossDetails(id);

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
  const isSelf =
    details.cross.seed_parent_genotype_id !== null &&
    details.cross.seed_parent_genotype_id ===
      details.cross.pollen_parent_genotype_id;

  return (
    <section className="dashboard-page">
      <Link className="back-link" href="/dashboard/crosses">
        ← 교배 목록
      </Link>
      <div className="dashboard-heading with-action">
        <div>
          <h1>{isSelf ? "Self 교배" : "교배 조합"}</h1>
          <p className="record-code">{details.cross.code}</p>
          <p>
            {details.cross.generation ?? "세대 미기록"} ·{" "}
            {details.cross.status}
          </p>
        </div>
        <div className="record-meta">
          <span>종자 {details.cross.seed_count ?? 0}</span>
          <span>발아 {details.cross.germinated_count ?? 0}</span>
          <span>{details.cross.visibility}</span>
          <span>사진 {details.media.length}</span>
        </div>
      </div>

      <section className="relation-section">
        <h2>부모 개체</h2>
        <div className="parent-grid">
          <article className="relation-card">
            <span>모주</span>
            {details.seedParent ? (
              <Link href={`/dashboard/genotypes/${details.seedParent.id}`}>
                <strong>{details.seedParent.display_name}</strong>
                <small>{details.seedParent.code}</small>
              </Link>
            ) : (
              <strong>미상·외부 기록</strong>
            )}
          </article>
          <article className="relation-card">
            <span>부주</span>
            {details.pollenParent ? (
              <Link href={`/dashboard/genotypes/${details.pollenParent.id}`}>
                <strong>{details.pollenParent.display_name}</strong>
                <small>{details.pollenParent.code}</small>
              </Link>
            ) : (
              <strong>미상·외부 기록</strong>
            )}
          </article>
        </div>
      </section>

      {details.cross.notes ? (
        <section className="relation-section">
          <h2>교배 메모</h2>
          <p className="description">{details.cross.notes}</p>
        </section>
      ) : null}

      <section className="relation-section">
        <div className="section-heading">
          <h2>자손 유전 개체</h2>
          <Link className="button secondary" href="/dashboard/crosses/seedling">
            자손 등록
          </Link>
        </div>
        {details.offspring.length === 0 ? (
          <div className="record-empty">
            <strong>등록된 자손이 없습니다.</strong>
          </div>
        ) : (
          <div className="record-list">
            {details.offspring.map((offspring) => (
              <article key={offspring.id}>
                <div>
                  <span>{offspring.code}</span>
                  <h2>
                    <Link href={`/dashboard/genotypes/${offspring.id}`}>
                      {offspring.display_name}
                    </Link>
                  </h2>
                </div>
                <div className="record-meta">
                  <span>{offspring.kind}</span>
                  <span>출처 {offspring.provenance_grade}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {activityItems.length > 0 ? (
        <section className="relation-section">
          <h2>교배 활동 이력</h2>
          <ActivityTimeline items={activityItems} />
        </section>
      ) : null}
    </section>
  );
}
