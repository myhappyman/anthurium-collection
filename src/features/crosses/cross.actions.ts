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
  createCrossSchema,
  createCrossSeedlingSchema,
} from "./cross.schemas";

export async function createCrossAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = createCrossSchema.safeParse({
    code: requiredFormString(formData.get("code")),
    seedParentGenotypeId: optionalFormString(
      formData.get("seedParentGenotypeId"),
    ),
    pollenParentGenotypeId: optionalFormString(
      formData.get("pollenParentGenotypeId"),
    ),
    generation: optionalFormString(formData.get("generation")),
    pollinatedAt: optionalFormString(formData.get("pollinatedAt")),
    notes: optionalFormString(formData.get("notes")),
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
  const { error } = await supabase.from("crosses").insert({
    owner_id: user.id,
    code: input.code,
    seed_parent_genotype_id: input.seedParentGenotypeId ?? null,
    pollen_parent_genotype_id: input.pollenParentGenotypeId ?? null,
    generation: input.generation ?? null,
    status: input.pollinatedAt ? "pollinated" : "planned",
    pollinated_at: input.pollinatedAt ?? null,
    notes: input.notes ?? null,
    visibility: input.visibility,
    published_at:
      input.visibility === "public" ? new Date().toISOString() : null,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/dashboard/crosses");
  redirect("/dashboard/crosses");
}

export async function createCrossSeedlingAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = createCrossSeedlingSchema.safeParse({
    crossId: requiredFormString(formData.get("crossId")),
    genotypeCode: requiredFormString(formData.get("genotypeCode")),
    displayName: requiredFormString(formData.get("displayName")),
    specimenCode: requiredFormString(formData.get("specimenCode")),
    germinatedAt: requiredFormString(formData.get("germinatedAt")),
    provenanceGrade: requiredFormString(formData.get("provenanceGrade")),
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
  const { error } = await supabase.rpc("create_cross_seedling", {
    source_cross_id: input.crossId,
    genotype_code: input.genotypeCode,
    genotype_display_name: input.displayName,
    specimen_code: input.specimenCode,
    germinated_at: input.germinatedAt,
    provenance_grade: input.provenanceGrade,
    target_visibility: input.visibility,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/dashboard/crosses");
  revalidatePath("/dashboard/genotypes");
  revalidatePath("/dashboard/specimens");
  redirect("/dashboard/crosses");
}
