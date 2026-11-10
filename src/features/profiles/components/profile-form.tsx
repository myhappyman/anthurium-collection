"use client";

import { useActionState } from "react";

import {
  INITIAL_ACTION_STATE,
  type ActionState,
} from "@/lib/actions/action-state";

import { saveProfileAction } from "../profile.actions";

type ProfileFormProps = {
  profile: {
    handle: string;
    display_name: string;
    bio: string | null;
    is_public: boolean;
  } | null;
};

export function ProfileForm({ profile }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState<
    ActionState,
    FormData
  >(saveProfileAction, INITIAL_ACTION_STATE);

  return (
    <form action={formAction} className="stack-form record-form">
      <div className="form-grid">
        <label>
          공개 주소 핸들
          <input
            defaultValue={profile?.handle}
            name="handle"
            placeholder="my-anthurium"
            required
          />
        </label>
        <label>
          표시 이름
          <input
            defaultValue={profile?.display_name}
            name="displayName"
            required
          />
        </label>
      </div>
      <label>
        소개
        <textarea defaultValue={profile?.bio ?? ""} name="bio" />
      </label>
      <label className="checkbox-field">
        <input
          defaultChecked={profile?.is_public ?? true}
          name="isPublic"
          type="checkbox"
        />
        공개 컬렉션 페이지 활성화
      </label>
      {state.status === "error" ? (
        <p className="form-message error">{state.message}</p>
      ) : null}
      <button className="button primary" disabled={isPending} type="submit">
        {isPending ? "저장 중…" : "프로필 저장"}
      </button>
    </form>
  );
}
