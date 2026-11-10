"use client";

import { type FormEvent, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type SubmissionState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function LoginForm() {
  const [state, setState] = useState<SubmissionState>({ status: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "submitting" });

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");

    if (typeof email !== "string" || email.trim().length === 0) {
      setState({ status: "error", message: "이메일을 입력해주세요." });
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setState({ status: "error", message: error.message });
      return;
    }

    setState({
      status: "success",
      message: "이메일로 로그인 링크를 전송했습니다.",
    });
  }

  return (
    <form className="stack-form" onSubmit={handleSubmit}>
      <label>
        이메일
        <input
          autoComplete="email"
          disabled={state.status === "submitting"}
          name="email"
          required
          type="email"
        />
      </label>
      <button
        className="button primary"
        disabled={state.status === "submitting"}
        type="submit"
      >
        {state.status === "submitting" ? "전송 중…" : "로그인 링크 받기"}
      </button>
      {state.status === "success" || state.status === "error" ? (
        <p className={`form-message ${state.status}`}>{state.message}</p>
      ) : null}
    </form>
  );
}
