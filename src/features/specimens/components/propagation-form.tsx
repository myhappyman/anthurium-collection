"use client";

import { useActionState } from "react";

import {
  INITIAL_ACTION_STATE,
  type ActionState,
} from "@/lib/actions/action-state";

import { createPropagationAction } from "../specimen.actions";

type SpecimenOption = {
  id: string;
  code: string;
};

type PropagationFormProps = {
  specimens: readonly SpecimenOption[];
};

export function PropagationForm({ specimens }: PropagationFormProps) {
  const [state, formAction, isPending] = useActionState<
    ActionState,
    FormData
  >(createPropagationAction, INITIAL_ACTION_STATE);

  return (
    <form action={formAction} className="stack-form record-form">
      <div className="form-grid">
        <label>
          원본 화분
          <select name="sourceSpecimenId" required>
            {specimens.map((specimen) => (
              <option key={specimen.id} value={specimen.id}>
                {specimen.code}
              </option>
            ))}
          </select>
        </label>
        <label>
          새 화분 코드
          <input name="targetCode" placeholder="PLT-2026-002" required />
        </label>
        <label>
          증식 방식
          <select defaultValue="stem_cut" name="method">
            <option value="stem_cut">줄기 절단</option>
            <option value="offset">오프셋</option>
            <option value="division">분주</option>
            <option value="tissue_culture">조직배양</option>
          </select>
        </label>
        <label>
          증식일
          <input name="propagatedAt" required type="date" />
        </label>
        <label>
          새 화분 공개 범위
          <select defaultValue="private" name="visibility">
            <option value="private">비공개</option>
            <option value="unlisted">링크 공개(공유 토큰 후속)</option>
            <option value="public">전체 공개</option>
          </select>
        </label>
      </div>
      <label className="checkbox-field">
        <input name="consumeSource" type="checkbox" />
        원본 줄기를 완전히 소모하여 원본 화분 상태를 `consumed`로 변경
      </label>
      <label>
        증식 메모
        <textarea
          name="notes"
          placeholder="top cut, mid cut, stump 등 절단 위치와 상태를 기록하세요."
        />
      </label>
      {state.status === "error" ? (
        <p className="form-message error">{state.message}</p>
      ) : null}
      <button className="button primary" disabled={isPending} type="submit">
        {isPending ? "생성 중…" : "복제 화분 생성"}
      </button>
    </form>
  );
}
