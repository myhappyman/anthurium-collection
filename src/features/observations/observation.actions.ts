"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ActionState } from "@/lib/actions/action-state";
import {
  optionalFormString,
  requiredFormString,
} from "@/lib/forms/form-data";
import { createClient } from "@/lib/supabase/server";

import { createObservationSchema } from "./observation.schemas";

function optionalNumber(value: FormDataEntryValue | null) {
  const normalized = optionalFormString(value);
  return normalized ? Number(normalized) : undefined;
}

export async function createObservationAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = createObservationSchema.safeParse({
    specimenId: requiredFormString(formData.get("specimenId")),
    observedAt: requiredFormString(formData.get("observedAt")),
    leafSequence: optionalNumber(formData.get("leafSequence")),
    leafLengthMm: optionalNumber(formData.get("leafLengthMm")),
    leafWidthMm: optionalNumber(formData.get("leafWidthMm")),
    petioleLengthMm: optionalNumber(formData.get("petioleLengthMm")),
    internodeLengthMm: optionalNumber(formData.get("internodeLengthMm")),
    emergentColor: optionalFormString(formData.get("emergentColor")),
    matureColor: optionalFormString(formData.get("matureColor")),
    veinDescription: optionalFormString(formData.get("veinDescription")),
    sinusDescription: optionalFormString(formData.get("sinusDescription")),
    texture: optionalFormString(formData.get("texture")),
    vigor: optionalNumber(formData.get("vigor")),
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
  const { error } = await supabase.from("observations").insert({
    owner_id: user.id,
    specimen_id: input.specimenId,
    observed_at: input.observedAt,
    leaf_sequence: input.leafSequence ?? null,
    leaf_length_mm: input.leafLengthMm ?? null,
    leaf_width_mm: input.leafWidthMm ?? null,
    petiole_length_mm: input.petioleLengthMm ?? null,
    internode_length_mm: input.internodeLengthMm ?? null,
    emergent_color: input.emergentColor ?? null,
    mature_color: input.matureColor ?? null,
    vein_description: input.veinDescription ?? null,
    sinus_description: input.sinusDescription ?? null,
    texture: input.texture ?? null,
    vigor: input.vigor ?? null,
    notes: input.notes ?? null,
    visibility: input.visibility,
    published_at:
      input.visibility === "public" ? new Date().toISOString() : null,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/dashboard/observations");
  redirect("/dashboard/observations");
}
