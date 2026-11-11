import Image from "next/image";
import Link from "next/link";

import {
  getCatalogNodes,
  getCatalogSummary,
} from "@/features/catalog/catalog.queries";
import {
  getCollectionSummary,
  getSpecimens,
} from "@/features/collection/collection.queries";
import { LineageCanvasLoader } from "@/features/lineage/components/lineage-canvas-loader";

/** 홈 첫 분할 섹션에 실을 대표 개체 (검은 배경 촬영본) */
const FEATURED_SPECIMEN_ID = "red-mama";

/** 설명의 첫 문장만 (field guide 행의 한 줄) */
function firstSentence(text: string | undefined) {
  if (!text) {
    return null;
  }

  const match = /^(.+?[.。])(\s|$)/.exec(text);
  return match?.[1] ?? text;
}

export default function HomePage() {
  const summary = getCatalogSummary();
  const collection = getCollectionSummary();
  const nodes = getCatalogNodes();
  const lineageNodes = nodes.map((node) => ({
    id: node.id,
    displayName: node.displayName,
    scientificName: node.scientificName,
    type: node.type,
    parents: node.parents,
    selectionOf: node.selectionOf,
  }));

  // 계보의 뿌리: 다른 분류군의 교배 부모이거나 선별의 바탕이 되는 원종
  const referenced = new Set<string>();
  for (const node of nodes) {
    for (const parent of node.parents) {
      referenced.add(parent);
    }
    if (node.selectionOf) {
      referenced.add(node.selectionOf);
    }
  }
  const rootSpecies = nodes.filter(
    (node) => node.type === "species" && referenced.has(node.id),
  );

  // 대표 사진: 어두운 배경에서 찍은 개체를 앞세운다(Hedgerow는 그늘 속 식물을 원한다).
  // 바꾸려면 아래 id를 고친다; 없으면 사진이 가장 많은 개체로 돌아간다.
  const specimens = getSpecimens();
  const featured =
    specimens.find(
      (specimen) =>
        specimen.id === FEATURED_SPECIMEN_ID && specimen.photos.length > 0,
    ) ??
    [...specimens]
      .filter((specimen) => specimen.photos.length > 0)
      .sort((left, right) => right.photos.length - left.photos.length)[0];
  const featuredPhoto = featured?.photos.at(-1);

  return (
    <>
      <section className="ledge" aria-labelledby="home-title">
        <div className="container">
          <div className="ledge-field">
            <LineageCanvasLoader embedded nodes={lineageNodes} />
          </div>
          <div className="ledge-base">
            <h1 id="home-title">개체의 출처부터 자손의 계보까지</h1>
            <div>
              <p className="lead">
                원종과 알려진 하이브리드를 살펴보고, 실제 보유 개체의 성장,
                교배, 증식 이력을 한곳에서 기록합니다.
              </p>
              <div className="hero-actions">
                <Link className="button primary" href="/catalog">
                  공개 도감 보기
                </Link>
                <Link className="button secondary" href="/specimens">
                  보유 개체 보기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="split" aria-labelledby="home-specimens">
        <div className="container split-grid">
          <div className="split-text">
            <h2 id="home-specimens">보유 개체</h2>
            <p className="lead">
              도감의 종·하이브리드 정보와 별개로, 실제 화분 단위로 사진과 출처
              증빙을 모았습니다.
            </p>
            <dl className="facts facts--row" aria-label="보유 현황">
              <div>
                <dt>보유 개체</dt>
                <dd>{collection.total}</dd>
              </div>
              <div>
                <dt>출처 증빙 있음</dt>
                <dd>{collection.documented}</dd>
              </div>
              <div>
                <dt>판매자 사진만</dt>
                <dd>{collection.photo}</dd>
              </div>
              <div>
                <dt>보유 사진</dt>
                <dd>{collection.photoCount}</dd>
              </div>
            </dl>
            <Link className="button secondary" href="/specimens">
              보유 개체 보기
            </Link>
          </div>
          {featured && featuredPhoto ? (
            <figure className="photo split-proof">
              <Link className="plate-photo" href={`/specimens/${featured.id}`}>
                <div className="photo-frame">
                  <Image
                    alt={`${featured.displayName} 보유 사진`}
                    height={featuredPhoto.height}
                    priority
                    sizes="(max-width: 60rem) 100vw, 55vw"
                    src={featuredPhoto.src}
                    width={featuredPhoto.width}
                  />
                </div>
              </Link>
              <figcaption>{featured.displayName}</figcaption>
            </figure>
          ) : null}
        </div>
      </section>

      <section className="split" aria-labelledby="home-catalog">
        <div className="container split-grid split-grid--4-8">
          <div className="split-text">
            <h2 id="home-catalog">안스리움 도감</h2>
            <dl className="facts facts--row" aria-label="도감 현황">
              <div>
                <dt>전체 노드</dt>
                <dd>{summary.total}</dd>
              </div>
              <div>
                <dt>원종</dt>
                <dd>{summary.species}</dd>
              </div>
              <div>
                <dt>선별종</dt>
                <dd>{summary.selection}</dd>
              </div>
              <div>
                <dt>하이브리드</dt>
                <dd>{summary.hybrid}</dd>
              </div>
            </dl>
          </div>
          <ol className="index split-proof" aria-label="계보의 뿌리가 되는 원종">
            {rootSpecies.map((node) => (
              <li key={node.id}>
                <p className="index-name">
                  <Link href={`/catalog/${node.id}`}>{node.displayName}</Link>
                </p>
                {node.scientificName ? (
                  <p className="latin">{node.scientificName}</p>
                ) : (
                  <span />
                )}
                <p className="index-line">{firstSentence(node.descriptionKo)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="statement" aria-label="기록 원칙">
        <div className="container">
          <p className="statement-text">
            계통은 라벨·판매자 자료에 적힌 내용만 기록합니다.
          </p>
        </div>
      </section>
    </>
  );
}
