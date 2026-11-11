"use client";

import { useActionState } from "react";

import {
  INITIAL_ACTION_STATE,
  type ActionState,
} from "@/lib/actions/action-state";

import { createCrossSeedlingAction } from "../cross.actions";

type CrossOption = {
  id: string;
  code: string;
};

type SeedlingFormProps = {
  crosses: readonly CrossOption[];
};

export function SeedlingForm({ crosses }: SeedlingFormProps) {
  const [state, formAction, isPending] = useActionState<
    ActionState,
    FormData
  >(createCrossSeedlingAction, INITIAL_ACTION_STATE);

  return (
    <form action={formAction} className="stack-form record-form">
      <div className="form-grid">
        <label>
          교배
          <select name="crossId" required>
            {crosses.map((cross) => (
              <option key={cross.id} value={cross.id}>
                {cross.code}
              </option>
            ))}
          </select>
        </label>
        <label>
          유전 개체 코드
          <input name="genotypeCode" placeholder="RVDP-S1-001" required />
        </label>
        <label>
          표시 이름
          <input name="displayName" placeholder="RVDP S1 #01" required />
        </label>
        <label>
          첫 화분 코드
          <input name="specimenCode" placeholder="PLT-2026-001" required />
        </label>
        <label>
          발아일
          <input name="germinatedAt" required type="date" />
        </label>
        <label>
          출처 신뢰도
          <select defaultValue="A" name="provenanceGrade">
            <option value="A">A: 자체 교배 원기록</option>
            <option value="B">B: 부모·배치 확인</option>
            <option value="C">C: 외부 주장</option>
            <option value="U">U: 미확인</option>
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
      {state.status === "error" ? (
        <p className="form-message error">{state.message}</p>
      ) : null}
      <button className="button primary" disabled={isPending} type="submit">
        {isPending ? "생성 중…" : "자손과 첫 화분 생성"}
      </button>
    </form>
  );
}
