"use client";

import { useActionState } from "react";

import {
  INITIAL_ACTION_STATE,
  type ActionState,
} from "@/lib/actions/action-state";

import { createGenotypeAction } from "../genotype.actions";

const GENOTYPE_KINDS = [
  ["named_clone", "이름 있는 클론"],
  ["selfed_seedling", "Self 실생"],
  ["cross_seedling", "교배 실생"],
  ["selected_seedling", "개인 선발 실생"],
  ["hybrid", "하이브리드"],
  ["species", "원종"],
  ["reference_only", "외부 모주·참조 전용"],
  ["unknown", "미확인"],
] as const;

export function GenotypeForm() {
  const [state, formAction, isPending] = useActionState<
    ActionState,
    FormData
  >(createGenotypeAction, INITIAL_ACTION_STATE);

  return (
    <form action={formAction} className="stack-form record-form">
      <div className="form-grid">
        <label>
          개체 코드
          <input name="code" placeholder="GEN-2026-001" required />
        </label>
        <label>
          표시 이름
          <input name="displayName" placeholder="RVDP S1 #01" required />
        </label>
        <label>
          개체 유형
          <select defaultValue="selfed_seedling" name="kind">
            {GENOTYPE_KINDS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          세대
          <input name="generation" placeholder="S1, F1, BC1" />
        </label>
        <label>
          브리더·생산자
          <input name="breederName" />
        </label>
        <label>
          출처 신뢰도
          <select defaultValue="U" name="provenanceGrade">
            <option value="A">A — 브리더 원기록 확인</option>
            <option value="B">B — 부모·배치 확인</option>
            <option value="C">C — 판매자 주장만 확인</option>
            <option value="D">D — 외형 추정</option>
            <option value="U">U — 미확인</option>
          </select>
        </label>
        <label>
          공개 범위
          <select defaultValue="private" name="visibility">
            <option value="private">비공개</option>
            <option value="unlisted">링크 공개(공유 토큰 후속)</option>
            <option value="public">전체 공개</option>
          </select>
        </label>
      </div>
      <label>
        출처 메모
        <textarea
          name="provenanceNotes"
          placeholder="판매자, 모주 사진, 배치 번호와 확인 근거를 기록하세요."
        />
      </label>
      {state.status === "error" ? (
        <p className="form-message error">{state.message}</p>
      ) : null}
      <button className="button primary" disabled={isPending} type="submit">
        {isPending ? "저장 중…" : "유전 개체 저장"}
      </button>
    </form>
  );
}
