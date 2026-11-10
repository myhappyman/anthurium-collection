"use client";

import { useActionState } from "react";

import {
  INITIAL_ACTION_STATE,
  type ActionState,
} from "@/lib/actions/action-state";

import { createTransactionAction } from "../transaction.actions";

type SpecimenOption = {
  id: string;
  code: string;
};

type TransactionFormProps = {
  specimens: readonly SpecimenOption[];
};

export function TransactionForm({ specimens }: TransactionFormProps) {
  const [state, formAction, isPending] = useActionState<
    ActionState,
    FormData
  >(createTransactionAction, INITIAL_ACTION_STATE);

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
          거래 유형
          <select defaultValue="purchase" name="kind">
            <option value="purchase">구매</option>
            <option value="sale">판매</option>
            <option value="gift_received">증여받음</option>
            <option value="gift_sent">증여함</option>
            <option value="trade">교환</option>
          </select>
        </label>
        <label>
          거래일
          <input name="transactedAt" required type="date" />
        </label>
        <label>
          거래 상대
          <input name="counterparty" />
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
        비공개 메모
        <textarea name="notes" />
      </label>
      <p className="form-hint">
        거래 기록은 공개 API 정책이 없으므로 소유자만 조회할 수 있습니다.
      </p>
      {state.status === "error" ? (
        <p className="form-message error">{state.message}</p>
      ) : null}
      <button className="button primary" disabled={isPending} type="submit">
        {isPending ? "저장 중…" : "거래 저장"}
      </button>
    </form>
  );
}
