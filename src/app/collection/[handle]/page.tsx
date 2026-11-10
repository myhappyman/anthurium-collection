import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublicProfile } from "@/features/profiles/profile.queries";
import { getPublicGenotypes } from "@/features/public-collection/public-collection.queries";

type CollectionPageProps = {
  params: Promise<{
    handle: string;
  }>;
};

export async function generateMetadata({
  params,
}: CollectionPageProps): Promise<Metadata> {
  const { handle } = await params;
  const profile = await getPublicProfile(handle);

  return {
    title: profile?.display_name ?? "공개 컬렉션",
    description: profile?.bio ?? "안스리움 공개 컬렉션",
  };
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { handle } = await params;
  const profile = await getPublicProfile(handle);

  if (!profile) {
    notFound();
  }

  const genotypes = await getPublicGenotypes(profile.id);

  return (
    <section className="page-section">
      <div className="collection-profile">
        <p className="eyebrow">PUBLIC COLLECTION</p>
        <h1>{profile.display_name}</h1>
        {profile.bio ? <p>{profile.bio}</p> : null}
      </div>
      {genotypes.length === 0 ? (
        <div className="record-empty">
          <strong>공개된 유전 개체가 없습니다.</strong>
        </div>
      ) : (
        <div className="public-genotype-grid">
          {genotypes.map((genotype) => (
            <article key={genotype.id}>
              <p>{genotype.code}</p>
              <h2>{genotype.display_name}</h2>
              <div className="record-meta">
                <span>{genotype.kind}</span>
                <span>출처 {genotype.provenance_grade}</span>
              </div>
              <Link
                href={`/collection/${handle}/genotypes/${genotype.code}`}
              >
                계보와 기록 보기 →
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
