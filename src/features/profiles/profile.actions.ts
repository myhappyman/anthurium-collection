"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ActionState } from "@/lib/actions/action-state";
import {
  optionalFormString,
  requiredFormString,
} from "@/lib/forms/form-data";
import { createClient } from "@/lib/supabase/server";

import { profileSchema } from "./profile.schemas";

export async function saveProfileAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = profileSchema.safeParse({
    handle: requiredFormString(formData.get("handle")),
    displayName: requiredFormString(formData.get("displayName")),
    bio: optionalFormString(formData.get("bio")),
    isPublic: formData.get("isPublic") === "on",
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
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      handle: input.handle,
      display_name: input.displayName,
      bio: input.bio ?? null,
      is_public: input.isPublic,
    },
    { onConflict: "id" },
  );

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath(`/collection/${input.handle}`);
  redirect("/dashboard/settings");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
