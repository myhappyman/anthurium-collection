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
  // 최근 촬영본(마지막 장)이 대표 사진; 나머지만 아래 갤러리에 싣는다
  const cover = specimen.photos.at(-1);
  const otherPhotos = specimen.photos.filter((photo) => photo !== cover);

  return (
    <article className="doc">
      <div className="container">
        <Link className="back-link" href="/specimens">
          ← 보유 개체로
        </Link>
        <header className={cover ? "stage" : "doc-head"}>
          <div className="stage-text">
            <div>
              <h1
                className={
                  specimen.displayName.length > 20 ? "display-s" : undefined
                }
              >
                {specimen.displayName}
              </h1>
              <p className="latin">{specimen.label}</p>
            </div>
            <dl className="facts facts--stack">
              <div>
                <dt>구분</dt>
                <dd>{SPECIMEN_KIND_LABELS[specimen.kind]}</dd>
              </div>
              <div>
                <dt>출처</dt>
                <dd>{PROVENANCE_GRADE_LABELS[specimen.provenanceGrade]}</dd>
              </div>
              {specimen.parentage ? (
                <div>
                  <dt>계통</dt>
                  <dd>{specimen.parentage}</dd>
                </div>
              ) : null}
            </dl>
            {specimen.noteKo ? <p className="doc-body">{specimen.noteKo}</p> : null}
          </div>
          {cover ? (
            <figure className="photo">
              <a
                className="plate-photo"
                href={cover.src}
                rel="noreferrer"
                target="_blank"
              >
                <div className="photo-frame">
                  <Image
                    alt={`${specimen.displayName} 사진`}
                    height={cover.height}
                    priority
                    sizes="(max-width: 60rem) 100vw, 50vw"
                    src={cover.src}
                    width={cover.width}
                  />
                </div>
              </a>
            </figure>
          ) : null}
        </header>

        <section className="relation-section">
          <h2>보유 사진</h2>
          {otherPhotos.length > 0 ? (
            <ul className="gallery">
              {otherPhotos.map((photo) => (
                <li key={photo.src}>
                  <a href={photo.src} rel="noreferrer" target="_blank">
                    <Image
                      alt={`${specimen.displayName} 사진`}
                      height={photo.height}
                      sizes="(max-width: 40rem) 100vw, 50vw"
                      src={photo.src}
                      width={photo.width}
                    />
                  </a>
                </li>
              ))}
            </ul>
          ) : cover ? (
            <p className="form-hint">보유 사진 {specimen.photos.length}장, 위의 대표 사진입니다.</p>
          ) : (
            <div className="record-empty">
              <strong>아직 보유 사진이 없습니다.</strong>
            </div>
          )}
        </section>

        {specimen.events.length > 0 ? (
          <section className="relation-section">
            <h2>특이사항</h2>
            <ul className="events">
              {specimen.events.map((event) => (
                <li key={event.summary}>
                  <span>{SPECIMEN_EVENT_LABELS[event.type]}</span>
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
            <ul className="gallery tracking">
              {tracking.map((image) => (
                <li key={image.src}>
                  <a href={image.src} rel="noreferrer" target="_blank">
                    <Image
                      alt={`${specimen.displayName} 출처 증빙`}
                      height={image.height}
                      sizes="(max-width: 40rem) 50vw, 25vw"
                      src={image.src}
                      unoptimized
                      width={image.width}
                    />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {catalogNodes.length > 0 ? (
          <section className="relation-section">
            <h2>관련 도감 항목</h2>
            <ol className="index index--two">
              {catalogNodes.map((node) => (
                <li key={node.id}>
                  <p className="index-name">
                    <Link href={`/catalog/${node.id}`}>{node.displayName}</Link>
                  </p>
                  {node.scientificName ? (
                    <p className="latin">{node.scientificName}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </div>
    </article>
  );
}
