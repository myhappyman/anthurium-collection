"use client";

import { useActionState } from "react";

import {
  INITIAL_ACTION_STATE,
  type ActionState,
} from "@/lib/actions/action-state";

import { createObservationAction } from "../observation.actions";

type SpecimenOption = {
  id: string;
  code: string;
};

type ObservationFormProps = {
  specimens: readonly SpecimenOption[];
};

export function ObservationForm({ specimens }: ObservationFormProps) {
  const [state, formAction, isPending] = useActionState<
    ActionState,
    FormData
  >(createObservationAction, INITIAL_ACTION_STATE);

  return (
    <form action={formAction} className="stack-form record-form">
      <div className="form-grid">
        <label>
          화분
          <select name="specimenId" required>
            {specimens.map((specimen) => (
              <option key={specimen.id} value={specimen.id}>
                {specimen.code}
              </option>
            ))}
          </select>
        </label>
        <label>
          관찰일
          <input name="observedAt" required type="date" />
        </label>
        <label>
          잎 순번
          <input min="1" name="leafSequence" type="number" />
        </label>
        <label>
          활력
          <select defaultValue="" name="vigor">
            <option value="">미기록</option>
            <option value="1">1 — 매우 약함</option>
            <option value="2">2 — 약함</option>
            <option value="3">3 — 보통</option>
            <option value="4">4 — 좋음</option>
            <option value="5">5 — 매우 좋음</option>
          </select>
        </label>
        <label>
          잎 길이(mm)
          <input min="0.1" name="leafLengthMm" step="0.1" type="number" />
        </label>
        <label>
          잎 폭(mm)
          <input min="0.1" name="leafWidthMm" step="0.1" type="number" />
        </label>
        <label>
          엽병 길이(mm)
          <input min="0.1" name="petioleLengthMm" step="0.1" type="number" />
        </label>
        <label>
          마디 간격(mm)
          <input min="0.1" name="internodeLengthMm" step="0.1" type="number" />
        </label>
        <label>
          신엽 색
          <input name="emergentColor" />
        </label>
        <label>
          경화 후 색
          <input name="matureColor" />
        </label>
        <label>
          맥 특징
          <input name="veinDescription" />
        </label>
        <label>
          Sinus 특징
          <input name="sinusDescription" />
        </label>
        <label>
          질감
          <input name="texture" />
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
        관찰 메모
        <textarea name="notes" />
      </label>
      {state.status === "error" ? (
        <p className="form-message error">{state.message}</p>
      ) : null}
      <button className="button primary" disabled={isPending} type="submit">
        {isPending ? "저장 중…" : "관찰 저장"}
      </button>
    </form>
  );
}
