"use client";

import { useActionState } from "react";

import {
  INITIAL_ACTION_STATE,
  type ActionState,
} from "@/lib/actions/action-state";

import { changeSpecimenStatusAction } from "../specimen.actions";

type StatusChangeFormProps = {
  specimenId: string;
  currentStatus: string;
  today: string;
};

export function StatusChangeForm({
  specimenId,
  currentStatus,
  today,
}: StatusChangeFormProps) {
  const [state, formAction, isPending] = useActionState<
    ActionState,
    FormData
  >(changeSpecimenStatusAction, INITIAL_ACTION_STATE);

  return (
    <form action={formAction} className="stack-form record-form">
      <input name="specimenId" type="hidden" value={specimenId} />
      <p className="form-hint">현재 상태: {currentStatus}</p>
      <div className="form-grid">
        <label>
          변경할 상태
          <select defaultValue="" name="status" required>
            <option disabled value="">
              상태 선택
            </option>
            <option value="active">생육 중</option>
            <option value="reserved">예약</option>
            <option value="listed">판매 게시</option>
            <option value="sold">판매 완료</option>
            <option value="transferred">양도 완료</option>
            <option value="consumed">번식 재료로 소진</option>
            <option value="died">폐사</option>
            <option value="lost">분실</option>
          </select>
        </label>
        <label>
          변경일
          <input defaultValue={today} name="occurredOn" required type="date" />
        </label>
        <label>
          함께 남길 거래
          <select defaultValue="" name="transactionKind">
            <option value="">거래 기록 없음</option>
            <option value="sale">판매</option>
            <option value="gift_sent">증여</option>
            <option value="trade">교환</option>
          </select>
        </label>
        <label>
          거래 상대
          <input maxLength={200} name="counterparty" />
        </label>
        <label>
          금액
          <input min="0" name="amount" step="0.01" type="number" />
        </label>
        <label>
          통화
          <input defaultValue="KRW" maxLength={3} name="currency" />
        </label>
      </div>
      <label>
        메모
        <textarea maxLength={2000} name="notes" />
      </label>
      <p className="form-hint">
        상태 변경과 선택한 거래는 하나의 작업으로 저장되어 일부만 기록되지
        않습니다.
      </p>
      {state.status === "error" ? (
        <p className="form-message error">{state.message}</p>
      ) : null}
      <button className="button primary" disabled={isPending} type="submit">
        {isPending ? "변경 중…" : "상태 변경"}
      </button>
    </form>
  );
}
