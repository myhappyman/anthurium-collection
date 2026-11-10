"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ActionState } from "@/lib/actions/action-state";
import {
  optionalFormString,
  requiredFormString,
} from "@/lib/forms/form-data";
import { createClient } from "@/lib/supabase/server";

import {
  changeSpecimenStatusSchema,
  createPropagationSchema,
  createSpecimenSchema,
} from "./specimen.schemas";

export async function createSpecimenAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = createSpecimenSchema.safeParse({
    genotypeId: requiredFormString(formData.get("genotypeId")),
    code: requiredFormString(formData.get("code")),
    propagationMethod: requiredFormString(formData.get("propagationMethod")),
    acquiredAt: optionalFormString(formData.get("acquiredAt")),
    startedAt: optionalFormString(formData.get("startedAt")),
    visibility: requiredFormString(formData.get("visibility")),
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
  const { error } = await supabase.from("specimens").insert({
    owner_id: user.id,
    genotype_id: input.genotypeId,
    code: input.code,
    propagation_method: input.propagationMethod,
    acquired_at: input.acquiredAt ?? null,
    started_at: input.startedAt ?? null,
    visibility: input.visibility,
    published_at:
      input.visibility === "public" ? new Date().toISOString() : null,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/dashboard/specimens");
  redirect("/dashboard/specimens");
}

export async function createPropagationAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = createPropagationSchema.safeParse({
    sourceSpecimenId: requiredFormString(formData.get("sourceSpecimenId")),
    targetCode: requiredFormString(formData.get("targetCode")),
    method: requiredFormString(formData.get("method")),
    propagatedAt: requiredFormString(formData.get("propagatedAt")),
    visibility: requiredFormString(formData.get("visibility")),
    notes: optionalFormString(formData.get("notes")),
    consumeSource: formData.get("consumeSource") === "on",
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
  const { error } = await supabase.rpc("create_clonal_specimen", {
    source_specimen_id: input.sourceSpecimenId,
    target_code: input.targetCode,
    propagation_method: input.method,
    propagated_at: input.propagatedAt,
    target_visibility: input.visibility,
    propagation_notes: input.notes ?? null,
    consume_source: input.consumeSource,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/dashboard/specimens");
  revalidatePath("/dashboard/propagations");
  redirect("/dashboard/propagations");
}

export async function changeSpecimenStatusAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const amountValue = optionalFormString(formData.get("amount"));
  const result = changeSpecimenStatusSchema.safeParse({
    specimenId: requiredFormString(formData.get("specimenId")),
    status: requiredFormString(formData.get("status")),
    occurredOn: requiredFormString(formData.get("occurredOn")),
    notes: optionalFormString(formData.get("notes")),
    transactionKind: optionalFormString(formData.get("transactionKind")),
    counterparty: optionalFormString(formData.get("counterparty")),
    amount: amountValue === undefined ? undefined : Number(amountValue),
    currency: optionalFormString(formData.get("currency")),
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
  const { error } = await supabase.rpc("record_specimen_status_change", {
    target_specimen_id: input.specimenId,
    target_status: input.status,
    occurred_on: input.occurredOn,
    change_notes: input.notes ?? null,
    related_transaction_kind: input.transactionKind ?? null,
    transaction_counterparty: input.counterparty ?? null,
    transaction_amount: input.amount ?? null,
    transaction_currency: input.currency ?? null,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/specimens");
  revalidatePath(`/dashboard/specimens/${input.specimenId}`);
  revalidatePath("/dashboard/transactions");
  redirect(`/dashboard/specimens/${input.specimenId}`);
}
