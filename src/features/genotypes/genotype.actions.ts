"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ActionState } from "@/lib/actions/action-state";
import {
  optionalFormString,
  requiredFormString,
} from "@/lib/forms/form-data";
import { createClient } from "@/lib/supabase/server";

import { createGenotypeSchema } from "./genotype.schemas";

export async function createGenotypeAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = createGenotypeSchema.safeParse({
    code: requiredFormString(formData.get("code")),
    displayName: requiredFormString(formData.get("displayName")),
    kind: requiredFormString(formData.get("kind")),
    generation: optionalFormString(formData.get("generation")),
    breederName: optionalFormString(formData.get("breederName")),
    provenanceGrade: requiredFormString(formData.get("provenanceGrade")),
    provenanceNotes: optionalFormString(formData.get("provenanceNotes")),
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
  const { error } = await supabase.from("genotypes").insert({
    owner_id: user.id,
    code: input.code,
    display_name: input.displayName,
    kind: input.kind,
    generation: input.generation ?? null,
    breeder_name: input.breederName ?? null,
    provenance_grade: input.provenanceGrade,
    provenance_notes: input.provenanceNotes ?? null,
    visibility: input.visibility,
    published_at:
      input.visibility === "public" ? new Date().toISOString() : null,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/dashboard/genotypes");
  redirect("/dashboard/genotypes");
}
