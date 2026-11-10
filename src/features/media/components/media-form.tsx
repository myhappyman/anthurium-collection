"use client";

import { type FormEvent, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import { createMediaSchema } from "../media.schemas";

type SpecimenOption = {
  id: string;
  code: string;
};

type MediaFormProps = {
  specimens: readonly SpecimenOption[];
};

type UploadState =
  | { status: "idle"; message: null }
  | { status: "uploading"; message: null }
  | { status: "error"; message: string };

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const IMAGE_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);
const EVIDENCE_CONTENT_TYPES = new Set([
  ...IMAGE_CONTENT_TYPES,
  "application/pdf",
]);

function getOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getFileExtension(file: File) {
  const extension = file.name.split(".").at(-1)?.toLowerCase();
  return extension && /^[a-z0-9]{2,5}$/.test(extension) ? extension : "bin";
}

export function MediaForm({ specimens }: MediaFormProps) {
  const [state, setState] = useState<UploadState>({
    status: "idle",
    message: null,
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "uploading", message: null });

    const formData = new FormData(event.currentTarget);
    const file = formData.get("file");
    const result = createMediaSchema.safeParse({
      specimenId: getRequiredString(formData, "specimenId"),
      kind: getRequiredString(formData, "kind"),
      capturedAt: getOptionalString(formData, "capturedAt"),
      altText: getOptionalString(formData, "altText"),
      caption: getOptionalString(formData, "caption"),
      visibility: getRequiredString(formData, "visibility"),
    });

    if (!result.success) {
      setState({
        status: "error",
        message: result.error.issues[0]?.message ?? "입력값을 확인해주세요.",
      });
      return;
    }

    if (!(file instanceof File) || file.size === 0) {
      setState({ status: "error", message: "파일을 선택해주세요." });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setState({ status: "error", message: "파일은 25MB 이하여야 합니다." });
      return;
    }

    const input = result.data;
    const isEvidence =
      input.kind === "provenance" || input.kind === "receipt";
    const allowedContentTypes = isEvidence
      ? EVIDENCE_CONTENT_TYPES
      : IMAGE_CONTENT_TYPES;

    if (!allowedContentTypes.has(file.type)) {
      setState({
        status: "error",
        message: "지원하지 않는 파일 형식입니다.",
      });
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setState({ status: "error", message: "로그인이 필요합니다." });
      return;
    }

    const bucketId =
      !isEvidence && input.visibility === "public"
        ? "public-media"
        : "private-evidence";
    const objectPath = `${user.id}/${crypto.randomUUID()}.${getFileExtension(file)}`;
    const { error: uploadError } = await supabase.storage
      .from(bucketId)
      .upload(objectPath, file, {
        cacheControl: "31536000",
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      setState({ status: "error", message: uploadError.message });
      return;
    }

    const effectiveVisibility =
      bucketId === "public-media" ? input.visibility : "private";
    const { error: metadataError } = await supabase.from("media").insert({
      owner_id: user.id,
      specimen_id: input.specimenId,
      kind: input.kind,
      bucket_id: bucketId,
      object_path: objectPath,
      captured_at: input.capturedAt ?? null,
      alt_text: input.altText ?? null,
      caption: input.caption ?? null,
      visibility: effectiveVisibility,
      published_at:
        effectiveVisibility === "public" ? new Date().toISOString() : null,
    });

    if (metadataError) {
      await supabase.storage.from(bucketId).remove([objectPath]);
      setState({ status: "error", message: metadataError.message });
      return;
    }

    window.location.assign("/dashboard/media");
  }

  return (
    <form className="stack-form record-form" onSubmit={handleSubmit}>
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
          자료 유형
          <select defaultValue="plant" name="kind">
            <option value="plant">식물 전체</option>
            <option value="leaf">잎</option>
            <option value="inflorescence">꽃차례</option>
            <option value="pollen">화분</option>
            <option value="seed">종자</option>
            <option value="provenance">출처 증빙</option>
            <option value="receipt">영수증</option>
            <option value="other">기타</option>
          </select>
        </label>
        <label>
          촬영일
          <input name="capturedAt" type="date" />
        </label>
        <label>
          공개 범위
          <select defaultValue="private" name="visibility">
            <option value="private">비공개</option>
            <option value="unlisted">링크 공개(공유 토큰 후속)</option>
            <option value="public">전체 공개</option>
          </select>
        </label>
      </div>
      <label>
        파일
        <input
          accept="image/jpeg,image/png,image/webp,image/avif,application/pdf"
          name="file"
          required
          type="file"
        />
      </label>
      <label>
        대체 텍스트
        <input name="altText" placeholder="사진 내용을 짧게 설명하세요." />
      </label>
      <label>
        설명
        <textarea name="caption" />
      </label>
      <p className="form-hint">
        파일은 브라우저에서 Storage로 직접 전송되며, 출처 증빙과 영수증은 공개
        설정을 선택해도 비공개 버킷에 저장됩니다.
      </p>
      {state.status === "error" ? (
        <p className="form-message error">{state.message}</p>
      ) : null}
      <button
        className="button primary"
        disabled={state.status === "uploading"}
        type="submit"
      >
        {state.status === "uploading" ? "업로드 중…" : "파일 업로드"}
      </button>
    </form>
  );
}
