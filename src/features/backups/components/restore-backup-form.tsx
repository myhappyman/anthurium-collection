"use client";

import { useState } from "react";

type RestoreStatus =
  | { kind: "idle"; message: null }
  | { kind: "loading"; message: string }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

const INITIAL_STATUS: RestoreStatus = {
  kind: "idle",
  message: null,
};

function getErrorMessage(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  ) {
    return value.error;
  }

  return "복원 요청을 처리하지 못했습니다.";
}

export function RestoreBackupForm() {
  const [status, setStatus] = useState<RestoreStatus>(INITIAL_STATUS);

  async function restoreBackup(formData: FormData) {
    const backupFile = formData.get("backup");

    if (!(backupFile instanceof File) || backupFile.size === 0) {
      setStatus({ kind: "error", message: "JSON 백업 파일을 선택해주세요." });
      return;
    }

    if (backupFile.size > 10 * 1024 * 1024) {
      setStatus({ kind: "error", message: "백업 파일은 10MB 이하여야 합니다." });
      return;
    }

    setStatus({ kind: "loading", message: "백업을 검증하고 복원 중입니다…" });

    try {
      const source = await backupFile.text();
      const parsed: unknown = JSON.parse(source);
      const response = await fetch("/api/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const responseBody: unknown = await response.json();

      if (!response.ok) {
        setStatus({ kind: "error", message: getErrorMessage(responseBody) });
        return;
      }

      setStatus({
        kind: "success",
        message: "복원이 완료되었습니다. 대시보드에서 기록을 확인해주세요.",
      });
    } catch {
      setStatus({
        kind: "error",
        message: "파일을 읽을 수 없거나 올바른 JSON이 아닙니다.",
      });
    }
  }

  return (
    <form action={restoreBackup} className="stack-form">
      <label>
        JSON 백업 파일
        <input accept="application/json,.json" name="backup" required type="file" />
      </label>
      <label className="checkbox-field">
        <input name="confirmed" required type="checkbox" />
        현재 계정에 유전 개체·화분·교배 기록이 없어야 한다는 점을 확인했습니다.
      </label>
      {status.message ? (
        <p
          className={
            status.kind === "error" ? "form-message error" : "form-hint"
          }
          role="status"
        >
          {status.message}
        </p>
      ) : null}
      <button
        className="button secondary"
        disabled={status.kind === "loading"}
        type="submit"
      >
        {status.kind === "loading" ? "복원 중…" : "빈 컬렉션에 복원"}
      </button>
    </form>
  );
}
