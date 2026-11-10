"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ActionState } from "@/lib/actions/action-state";
import {
  optionalFormString,
  requiredFormString,
} from "@/lib/forms/form-data";
import { createClient } from "@/lib/supabase/server";

import { createTransactionSchema } from "./transaction.schemas";

export async function createTransactionAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const amount = optionalFormString(formData.get("amount"));
  const result = createTransactionSchema.safeParse({
    specimenId: requiredFormString(formData.get("specimenId")),
    kind: requiredFormString(formData.get("kind")),
    transactedAt: requiredFormString(formData.get("transactedAt")),
    counterparty: optionalFormString(formData.get("counterparty")),
    amount: amount ? Number(amount) : undefined,
    currency: optionalFormString(formData.get("currency")),
    notes: optionalFormString(formData.get("notes")),
  });

  if (!result.success) {
    return {
      status: "error",
      message: result.error.issues[0]?.message ?? "입력값을 확인해주세요.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "로그인이 필요합니다." };
  }

  const input = result.data;
  const { error } = await supabase.from("transactions").insert({
    owner_id: user.id,
    specimen_id: input.specimenId,
    kind: input.kind,
    transacted_at: input.transactedAt,
    counterparty: input.counterparty ?? null,
    amount: input.amount ?? null,
    currency: input.currency ?? null,
    notes: input.notes ?? null,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/dashboard/transactions");
  redirect("/dashboard/transactions");
}
