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

/** 설명의 첫 문장만 */
function firstSentence(text: string | undefined) {
  if (!text) {
    return null;
  }

  const match = /^(.+?[.。])(\s|$)/.exec(text);
  return match?.[1] ?? text;
}

/** 보유 개체 플레이트: 정사각 사진 한 장과 이름, 라벨, 출처, 계통, 메모의 첫 문장 */
export function SpecimenCard({ specimen, trackingCount = 0 }: SpecimenCardProps) {
  // 파일명 번호가 큰 쪽(최근 촬영본)이 뒤에 오므로 마지막 장을 대표 사진으로 쓴다
  const cover = specimen.photos.at(-1);
  const note = firstSentence(specimen.noteKo);

  return (
    <li className="plate">
      <Link className="plate-photo" href={`/specimens/${specimen.id}`}>
        <div className="photo-frame">
          {cover ? (
            <Image
              alt={`${specimen.displayName} 보유 사진`}
              height={cover.height}
              sizes="(max-width: 60rem) 100vw, 22vw"
              src={cover.src}
              width={cover.width}
            />
          ) : (
            <span className="photo-empty">사진 없음</span>
          )}
        </div>
      </Link>
      <div className="plate-text">
        <h3>
          <Link href={`/specimens/${specimen.id}`}>{specimen.displayName}</Link>
        </h3>
        <p className="latin">{specimen.label}</p>
        <ul className="meta">
          <li>{SPECIMEN_KIND_LABELS[specimen.kind]}</li>
          <li>{PROVENANCE_GRADE_LABELS[specimen.provenanceGrade]}</li>
          {specimen.photos.length > 0 ? <li>사진 {specimen.photos.length}장</li> : null}
          {trackingCount > 0 ? <li>증빙 {trackingCount}장</li> : null}
        </ul>
        {specimen.parentage ? (
          <p className="plate-line">{specimen.parentage}</p>
        ) : null}
        {note ? <p className="plate-line">{note}</p> : null}
      </div>
    </li>
  );
}
