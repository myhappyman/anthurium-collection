import { NextResponse } from "next/server";

import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  if (!getSupabaseConfig()) {
    return NextResponse.json(
      { error: "Supabase 연결이 필요합니다." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const [
    profileResult,
    genotypesResult,
    specimensResult,
    crossesResult,
    propagationsResult,
    observationsResult,
    activityResult,
    mediaResult,
    transactionsResult,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("genotypes").select("*").eq("owner_id", user.id),
    supabase.from("specimens").select("*").eq("owner_id", user.id),
    supabase.from("crosses").select("*").eq("owner_id", user.id),
    supabase.from("propagation_events").select("*").eq("owner_id", user.id),
    supabase.from("observations").select("*").eq("owner_id", user.id),
    supabase.from("activity_events").select("*").eq("owner_id", user.id),
    supabase.from("media").select("*").eq("owner_id", user.id),
    supabase.from("transactions").select("*").eq("owner_id", user.id),
  ]);
  const firstError = [
    profileResult.error,
    genotypesResult.error,
    specimensResult.error,
    crossesResult.error,
    propagationsResult.error,
    observationsResult.error,
    activityResult.error,
    mediaResult.error,
    transactionsResult.error,
  ].find((error) => error !== null);

  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  const exportedAt = new Date();
  const body = {
    schemaVersion: 1,
    exportedAt: exportedAt.toISOString(),
    profile: profileResult.data,
    genotypes: genotypesResult.data,
    specimens: specimensResult.data,
    crosses: crossesResult.data,
    propagationEvents: propagationsResult.data,
    observations: observationsResult.data,
    activityEvents: activityResult.data,
    media: mediaResult.data,
    transactions: transactionsResult.data,
  };
  const date = exportedAt.toISOString().slice(0, 10);

  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Disposition": `attachment; filename="anthurium-backup-${date}.json"`,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}
