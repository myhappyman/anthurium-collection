import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ActivityTimeline,
  type TimelineItem,
} from "@/features/activity/components/activity-timeline";
import { getPublicProfile } from "@/features/profiles/profile.queries";
import {
  getPublicSpecimen,
  getPublicSpecimenDetails,
} from "@/features/public-collection/public-collection.queries";

type PublicSpecimenPageProps = {
  params: Promise<{ handle: string; code: string }>;
};

export async function generateMetadata({
  params,
}: PublicSpecimenPageProps): Promise<Metadata> {
  const { handle, code } = await params;
  const profile = await getPublicProfile(handle);
  const specimen = profile ? await getPublicSpecimen(profile.id, code) : null;

  return {
    title: specimen?.code ?? "공개 화분",
  };
}

export default async function PublicSpecimenPage({
  params,
}: PublicSpecimenPageProps) {
  const { handle, code } = await params;
  const profile = await getPublicProfile(handle);

  if (!profile) {
    notFound();
  }

  const specimen = await getPublicSpecimen(profile.id, code);

  if (!specimen) {
    notFound();
  }

  const details = await getPublicSpecimenDetails(
    profile.id,
    specimen.id,
    specimen.genotype_id,
  );
  const activityItems: TimelineItem[] = details.activityEvents.map((event) => ({
    id: event.id,
    occurredAt: event.occurred_at,
    label: event.kind,
    detail: event.notes,
    category: "activity",
  }));
  const observationItems: TimelineItem[] = details.observations.map(
    (observation) => ({
      id: observation.id,
      occurredAt: observation.observed_at,
      label:
        observation.leaf_sequence === null
          ? "생육 관찰"
          : `잎 #${observation.leaf_sequence} 관찰`,
      detail: [
        observation.leaf_length_mm === null
          ? null
          : `길이 ${observation.leaf_length_mm}mm`,
        observation.leaf_width_mm === null
          ? null
          : `폭 ${observation.leaf_width_mm}mm`,
        observation.vigor === null ? null : `활력 ${observation.vigor}`,
        observation.notes,
      ]
        .filter((value): value is string => Boolean(value))
        .join(" · "),
      category: "observation",
    }),
  );
  const timelineItems = [...activityItems, ...observationItems].sort(
    (first, second) =>
      new Date(second.occurredAt).getTime() -
      new Date(first.occurredAt).getTime(),
  );

  return (
    <article className="detail-page">
      <Link className="back-link" href={`/collection/${handle}`}>
        ← {profile.display_name}
      </Link>
      <p className="eyebrow">{specimen.code}</p>
      <h1>{details.genotype?.display_name ?? "공개 화분"}</h1>
      <div className="chip-row">
        <span className="chip">{specimen.status}</span>
        <span className="chip">{specimen.propagation_method}</span>
        <span className="chip">사진 {details.media.length}</span>
      </div>
      {details.genotype ? (
        <p className="description">
          유전 개체:{" "}
          <Link
            href={`/collection/${handle}/genotypes/${details.genotype.code}`}
          >
            {details.genotype.code} · {details.genotype.display_name}
          </Link>
        </p>
      ) : null}

      <section className="relation-section">
        <h2>공개 생육 이력</h2>
        <ActivityTimeline items={timelineItems} />
      </section>
    </article>
  );
}
