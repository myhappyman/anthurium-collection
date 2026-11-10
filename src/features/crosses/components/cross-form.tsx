"use client";

import { useActionState } from "react";

import {
  INITIAL_ACTION_STATE,
  type ActionState,
} from "@/lib/actions/action-state";

import { createCrossAction } from "../cross.actions";

type GenotypeOption = {
  id: string;
  code: string;
  display_name: string;
};

type CrossFormProps = {
  genotypes: readonly GenotypeOption[];
};

export function CrossForm({ genotypes }: CrossFormProps) {
  const [state, formAction, isPending] = useActionState<
    ActionState,
    FormData
  >(createCrossAction, INITIAL_ACTION_STATE);

  return (
    <form action={formAction} className="stack-form record-form">
      <div className="form-grid">
        <label>
          교배 코드
          <input name="code" placeholder="CROSS-2026-001" required />
        </label>
        <label>
          세대 표기
          <input name="generation" placeholder="S1, F1, BC1" />
        </label>
        <label>
          종자 부모
          <select defaultValue="" name="seedParentGenotypeId">
            <option value="">미확인</option>
            {genotypes.map((genotype) => (
              <option key={genotype.id} value={genotype.id}>
                {genotype.code} · {genotype.display_name}
              </option>
            ))}
          </select>
        </label>
        <label>
          화분 부모
          <select defaultValue="" name="pollenParentGenotypeId">
            <option value="">미확인</option>
            {genotypes.map((genotype) => (
              <option key={genotype.id} value={genotype.id}>
                {genotype.code} · {genotype.display_name}
              </option>
            ))}
          </select>
        </label>
        <label>
          수분일
          <input name="pollinatedAt" type="date" />
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
      <p className="form-hint">
        Self는 종자 부모와 화분 부모에 같은 유전 개체를 선택합니다.
      </p>
      <label>
        교배 메모
        <textarea name="notes" />
      </label>
      {state.status === "error" ? (
        <p className="form-message error">{state.message}</p>
      ) : null}
      <button className="button primary" disabled={isPending} type="submit">
        {isPending ? "저장 중…" : "교배 저장"}
      </button>
    </form>
  );
}
