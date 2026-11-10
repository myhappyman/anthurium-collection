"use client";

import { useActionState } from "react";

import {
  INITIAL_ACTION_STATE,
  type ActionState,
} from "@/lib/actions/action-state";

import { createSpecimenAction } from "../specimen.actions";

type GenotypeOption = {
  id: string;
  code: string;
  display_name: string;
};

type SpecimenFormProps = {
  genotypes: readonly GenotypeOption[];
};

export function SpecimenForm({ genotypes }: SpecimenFormProps) {
  const [state, formAction, isPending] = useActionState<
    ActionState,
    FormData
  >(createSpecimenAction, INITIAL_ACTION_STATE);

  return (
    <form action={formAction} className="stack-form record-form">
      <div className="form-grid">
        <label>
          유전 개체
          <select name="genotypeId" required>
            {genotypes.map((genotype) => (
              <option key={genotype.id} value={genotype.id}>
                {genotype.code} · {genotype.display_name}
              </option>
            ))}
          </select>
        </label>
        <label>
          화분 코드
          <input name="code" placeholder="PLT-2026-001" required />
        </label>
        <label>
          생성·취득 방식
          <select defaultValue="seed" name="propagationMethod">
            <option value="seed">실생</option>
            <option value="offset">오프셋</option>
            <option value="division">분주</option>
            <option value="stem_cut">줄기 절단</option>
            <option value="tissue_culture">조직배양</option>
          </select>
        </label>
        <label>
          취득일
          <input name="acquiredAt" type="date" />
        </label>
        <label>
          생육 시작일
          <input name="startedAt" type="date" />
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
        {isPending ? "저장 중…" : "화분 저장"}
      </button>
    </form>
  );
}
