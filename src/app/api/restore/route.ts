import { NextResponse } from "next/server";

import { collectionBackupSchema } from "@/features/backups/backup.schemas";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const MAX_BACKUP_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  if (!getSupabaseConfig()) {
    return NextResponse.json(
      { error: "Supabase 연결이 필요합니다." },
      { status: 503 },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);

  if (contentLength > MAX_BACKUP_BYTES) {
    return NextResponse.json(
      { error: "백업 파일은 10MB 이하여야 합니다." },
      { status: 413 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "올바른 JSON 파일이 아닙니다." },
      { status: 400 },
    );
  }

  const result = collectionBackupSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      {
        error:
          result.error.issues[0]?.message ??
          "지원하는 백업 형식이 아닙니다.",
      },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("restore_collection_backup", {
    backup_data: result.data,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  return NextResponse.json({ restored: data });
}
