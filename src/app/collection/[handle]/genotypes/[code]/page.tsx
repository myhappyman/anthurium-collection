import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublicProfile } from "@/features/profiles/profile.queries";
import {
  getPublicGenotype,
  getPublicGenotypeDetails,
} from "@/features/public-collection/public-collection.queries";

type PublicGenotypePageProps = {
  params: Promise<{
    handle: string;
    code: string;
  }>;
};

export async function generateMetadata({
  params,
}: PublicGenotypePageProps): Promise<Metadata> {
  const { handle, code } = await params;
  const profile = await getPublicProfile(handle);
  const genotype = profile
    ? await getPublicGenotype(profile.id, code)
    : null;

  return {
    title: genotype?.display_name ?? "공개 개체",
  };
}

export default async function PublicGenotypePage({
  params,
}: PublicGenotypePageProps) {
  const { handle, code } = await params;
  const profile = await getPublicProfile(handle);

  if (!profile) {
    notFound();
  }

  const genotype = await getPublicGenotype(profile.id, code);

  if (!genotype) {
    notFound();
  }

  const details = await getPublicGenotypeDetails(profile.id, genotype.id);

  return (
    <article className="detail-page">
      <Link className="back-link" href={`/collection/${handle}`}>
        ← {profile.display_name}
      </Link>
      <h1>{genotype.display_name}</h1>
      <p className="record-code">{genotype.code}</p>
      <div className="chip-row">
        <span className="chip">{genotype.kind}</span>
        {genotype.generation ? (
          <span className="chip">{genotype.generation}</span>
        ) : null}
        <span className="chip">출처 {genotype.provenance_grade}</span>
      </div>
      {genotype.breeder_name ? (
        <p className="description">브리더·생산자: {genotype.breeder_name}</p>
      ) : null}

      <section className="relation-section">
        <h2>공개 화분</h2>
        <div className="record-list">
          {details.specimens.map((specimen) => (
            <article key={specimen.id}>
              <div>
                <span>{specimen.code}</span>
                <h2>
                  <Link
                    href={`/collection/${handle}/specimens/${specimen.code}`}
                  >
                    {specimen.status}
                  </Link>
                </h2>
              </div>
              <div className="record-meta">
                <span>{specimen.propagation_method}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {details.crosses.length > 0 ? (
        <section className="relation-section">
          <h2>이 개체가 참여한 공개 교배</h2>
          <div className="relation-links">
            {details.crosses.map((cross) => (
              <Link
                className="chip"
                href={`/collection/${handle}/crosses/${cross.code}`}
                key={cross.id}
              >
                {cross.code} · {cross.status}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
