import Image from "next/image";
import Link from "next/link";

import {
  PROVENANCE_GRADE_LABELS,
  SPECIMEN_KIND_LABELS,
  type Specimen,
} from "../collection.types";

type SpecimenCardProps = {
  specimen: Specimen;
  /** 비공개 기록이 켜진 서버에서만 전달된다 */
  trackingCount?: number;
};

export function SpecimenCard({ specimen, trackingCount = 0 }: SpecimenCardProps) {
  // 파일명 번호가 큰 쪽(최근 촬영본)이 뒤에 오므로 마지막 장을 대표 사진으로 쓴다
  const cover = specimen.photos.at(-1);

  return (
    <article className="specimen-card">
      <Link className="specimen-cover" href={`/specimens/${specimen.id}`}>
        {cover ? (
          <Image
            alt={`${specimen.displayName} 보유 사진`}
            src={cover.src}
            width={cover.width}
            height={cover.height}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <span className="specimen-cover-empty">사진 없음</span>
        )}
      </Link>
      <div className="specimen-card-body">
        <p className="catalog-card-type">{SPECIMEN_KIND_LABELS[specimen.kind]}</p>
        <h2>
          <Link href={`/specimens/${specimen.id}`}>{specimen.displayName}</Link>
        </h2>
        <p className="specimen-label">{specimen.label}</p>
        <div className="chip-row">
          <span className={`chip provenance-${specimen.provenanceGrade}`}>
            {PROVENANCE_GRADE_LABELS[specimen.provenanceGrade]}
          </span>
          {trackingCount > 0 ? (
            <span className="chip">증빙 {trackingCount}장</span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
