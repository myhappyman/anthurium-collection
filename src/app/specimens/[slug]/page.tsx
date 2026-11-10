import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCatalogNode } from "@/features/catalog/catalog.queries";
import {
  getSpecimen,
  getSpecimens,
} from "@/features/collection/collection.queries";
import { getPrivateRecord } from "@/features/collection/private-records";
import {
  ACQUISITION_METHOD_LABELS,
  PROVENANCE_GRADE_LABELS,
  SPECIMEN_EVENT_LABELS,
  SPECIMEN_KIND_LABELS,
} from "@/features/collection/collection.types";

type SpecimenDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return getSpecimens().map((specimen) => ({ slug: specimen.id }));
}

export async function generateMetadata({
  params,
}: SpecimenDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const specimen = getSpecimen(slug);

  if (!specimen) {
    return { title: "개체를 찾을 수 없음" };
  }

  return {
    title: specimen.displayName,
    description: specimen.noteKo ?? `${specimen.displayName} 보유 기록`,
  };
}

export default async function SpecimenDetailPage({
  params,
}: SpecimenDetailPageProps) {
  const { slug } = await params;
  const specimen = getSpecimen(slug);

  if (!specimen) {
    notFound();
  }

  const catalogNodes = specimen.catalogRefs
    .map((id) => getCatalogNode(id))
    .filter((node) => node !== undefined);
  // SHOW_PRIVATE_RECORDS 가 꺼진 환경(배포본)에서는 항상 null 이라 아래 섹션이 생성되지 않는다
  const privateRecord = getPrivateRecord(specimen.id);
  const acquisition = privateRecord?.acquisition ?? null;
  const tracking = privateRecord?.tracking ?? [];

  return (
    <article className="detail-page">
      <Link className="back-link" href="/specimens">
        ← 보유 개체로
      </Link>
      <p className="eyebrow">{SPECIMEN_KIND_LABELS[specimen.kind]}</p>
      <h1>{specimen.displayName}</h1>
      <p className="scientific-name">{specimen.label}</p>
      <div className="chip-row">
        <span className={`chip provenance-${specimen.provenanceGrade}`}>
          {PROVENANCE_GRADE_LABELS[specimen.provenanceGrade]}
        </span>
        {specimen.parentage ? (
          <span className="chip">{specimen.parentage}</span>
        ) : null}
      </div>
      {specimen.noteKo ? <p className="description">{specimen.noteKo}</p> : null}

      <section className="relation-section">
        <h2>보유 사진</h2>
        {specimen.photos.length > 0 ? (
          <div className="specimen-gallery">
            {specimen.photos.map((photo) => (
              <a href={photo.src} key={photo.src} target="_blank" rel="noreferrer">
                <Image
                  alt={`${specimen.displayName} 사진`}
                  src={photo.src}
                  width={photo.width}
                  height={photo.height}
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
              </a>
            ))}
          </div>
        ) : (
          <div className="record-empty">
            <strong>아직 보유 사진이 없습니다.</strong>
          </div>
        )}
      </section>

      {specimen.events.length > 0 ? (
        <section className="relation-section">
          <h2>특이사항</h2>
          <ul className="specimen-events">
            {specimen.events.map((event) => (
              <li key={event.summary}>
                <span className="chip">{SPECIMEN_EVENT_LABELS[event.type]}</span>
                <span>{event.summary}</span>
                {event.date ? <time>{event.date}</time> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {acquisition ? (
        <section className="relation-section">
          <h2>입수 기록</h2>
          <dl className="specimen-facts">
            {acquisition.method ? (
              <div>
                <dt>입수 방식</dt>
                <dd>{ACQUISITION_METHOD_LABELS[acquisition.method]}</dd>
              </div>
            ) : null}
            <div>
              <dt>{acquisition.method === "gift" ? "나눔해 준 분" : "구매처"}</dt>
              <dd>{acquisition.source}</dd>
            </div>
            {acquisition.channel ? (
              <div>
                <dt>경로</dt>
                <dd>{acquisition.channel}</dd>
              </div>
            ) : null}
            {acquisition.chain.length > 0 ? (
              <div>
                <dt>소유 이력</dt>
                <dd>
                  <ol className="specimen-chain">
                    {acquisition.chain.map((owner) => (
                      <li key={owner}>{owner}</li>
                    ))}
                    <li>본인</li>
                  </ol>
                </dd>
              </div>
            ) : null}
            {acquisition.note ? (
              <div className="specimen-facts-wide">
                <dt>메모</dt>
                <dd>{acquisition.note}</dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}

      {tracking.length > 0 ? (
        <section className="relation-section">
          <h2>출처 증빙</h2>
          <p className="form-hint">
            비공개 기록입니다. SHOW_PRIVATE_RECORDS 가 켜진 환경에서만 보입니다.
          </p>
          <div className="specimen-gallery tracking">
            {tracking.map((image) => (
              <a href={image.src} key={image.src} target="_blank" rel="noreferrer">
                <Image
                  alt={`${specimen.displayName} 출처 증빙`}
                  src={image.src}
                  width={image.width}
                  height={image.height}
                  sizes="(max-width: 640px) 50vw, 25vw"
                  unoptimized
                />
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {catalogNodes.length > 0 ? (
        <section className="relation-section">
          <h2>관련 도감 항목</h2>
          <div className="relation-links">
            {catalogNodes.map((node) => (
              <Link href={`/catalog/${node.id}`} key={node.id}>
                {node.displayName}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
