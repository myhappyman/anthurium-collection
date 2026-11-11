import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ActivityTimeline,
  type TimelineItem,
} from "@/features/activity/components/activity-timeline";
import { getPublicProfile } from "@/features/profiles/profile.queries";
import {
  getPublicCross,
  getPublicCrossDetails,
} from "@/features/public-collection/public-collection.queries";

type PublicCrossPageProps = {
  params: Promise<{ handle: string; code: string }>;
};

export async function generateMetadata({
  params,
}: PublicCrossPageProps): Promise<Metadata> {
  const { handle, code } = await params;
  const profile = await getPublicProfile(handle);
  const cross = profile ? await getPublicCross(profile.id, code) : null;

  return {
    title: cross ? `${cross.code} 교배` : "공개 교배",
  };
}

export default async function PublicCrossPage({
  params,
}: PublicCrossPageProps) {
  const { handle, code } = await params;
  const profile = await getPublicProfile(handle);

  if (!profile) {
    notFound();
  }

  const cross = await getPublicCross(profile.id, code);

  if (!cross) {
    notFound();
  }

  const parentIds = [
    cross.seed_parent_genotype_id,
    cross.pollen_parent_genotype_id,
  ].filter((value): value is string => value !== null);
  const details = await getPublicCrossDetails(profile.id, cross.id, parentIds);
  const seedParent =
    details.parents.find(
      (parent) => parent.id === cross.seed_parent_genotype_id,
    ) ?? null;
  const pollenParent =
    details.parents.find(
      (parent) => parent.id === cross.pollen_parent_genotype_id,
    ) ?? null;
  const activityItems: TimelineItem[] = details.activityEvents.map((event) => ({
    id: event.id,
    occurredAt: event.occurred_at,
    label: event.kind,
    detail: event.notes,
    category: "activity",
  }));

  return (
    <article className="detail-page">
      <Link className="back-link" href={`/collection/${handle}`}>
        ← {profile.display_name}
      </Link>
      <h1>
        {cross.seed_parent_genotype_id !== null &&
        cross.seed_parent_genotype_id === cross.pollen_parent_genotype_id
          ? "Self 교배"
          : "교배 조합"}
      </h1>
      <p className="record-code">{cross.code}</p>
      <dl className="facts facts--figures">
        <div>
          <dt>상태</dt>
          <dd>{cross.status}</dd>
        </div>
        {cross.generation ? (
          <div>
            <dt>세대</dt>
            <dd>{cross.generation}</dd>
          </div>
        ) : null}
        <div>
          <dt>종자</dt>
          <dd>{cross.seed_count ?? 0}</dd>
        </div>
        <div>
          <dt>발아</dt>
          <dd>{cross.germinated_count ?? 0}</dd>
        </div>
      </dl>

      <section className="relation-section">
        <h2>부모 개체</h2>
        <div className="parent-grid">
          <article className="relation-card">
            <span>모주</span>
            {seedParent ? (
              <Link
                href={`/collection/${handle}/genotypes/${seedParent.code}`}
              >
                <strong>{seedParent.display_name}</strong>
                <small>{seedParent.code}</small>
              </Link>
            ) : (
              <strong>비공개 또는 미상</strong>
            )}
          </article>
          <article className="relation-card">
            <span>부주</span>
            {pollenParent ? (
              <Link
                href={`/collection/${handle}/genotypes/${pollenParent.code}`}
              >
                <strong>{pollenParent.display_name}</strong>
                <small>{pollenParent.code}</small>
              </Link>
            ) : (
              <strong>비공개 또는 미상</strong>
            )}
          </article>
        </div>
      </section>

      {cross.notes ? (
        <section className="relation-section">
          <h2>공개 메모</h2>
          <p className="description">{cross.notes}</p>
        </section>
      ) : null}

      <section className="relation-section">
        <h2>공개 자손</h2>
        {details.offspring.length === 0 ? (
          <div className="record-empty">
            <strong>공개된 자손이 없습니다.</strong>
          </div>
        ) : (
          <div className="public-genotype-grid">
            {details.offspring.map((offspring) => (
              <article key={offspring.id}>
                <p>{offspring.code}</p>
                <h2>{offspring.display_name}</h2>
                <Link
                  href={`/collection/${handle}/genotypes/${offspring.code}`}
                >
                  개체 기록 보기
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      {activityItems.length > 0 ? (
        <section className="relation-section">
          <h2>교배 이력</h2>
          <ActivityTimeline items={activityItems} />
        </section>
      ) : null}
    </article>
  );
}
