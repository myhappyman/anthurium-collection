import { NextResponse } from "next/server";

import { serializeCsv } from "@/lib/csv";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type CsvExportRouteProps = {
  params: Promise<{ table: string }>;
};

function createCsvResponse(rows: readonly object[], table: string) {
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(serializeCsv(rows), {
    headers: {
      "Content-Disposition": `attachment; filename="anthurium-${table}-${date}.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(_request: Request, { params }: CsvExportRouteProps) {
  if (!getSupabaseConfig()) {
    return NextResponse.json(
      { error: "Supabase 연결이 필요합니다." },
      { status: 503 },
    );
  }

  const { table } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  switch (table) {
    case "genotypes": {
      const { data, error } = await supabase
        .from("genotypes")
        .select("*")
        .eq("owner_id", user.id);
      return error
        ? NextResponse.json({ error: error.message }, { status: 500 })
        : createCsvResponse(data, table);
    }
    case "specimens": {
      const { data, error } = await supabase
        .from("specimens")
        .select("*")
        .eq("owner_id", user.id);
      return error
        ? NextResponse.json({ error: error.message }, { status: 500 })
        : createCsvResponse(data, table);
    }
    case "crosses": {
      const { data, error } = await supabase
        .from("crosses")
        .select("*")
        .eq("owner_id", user.id);
      return error
        ? NextResponse.json({ error: error.message }, { status: 500 })
        : createCsvResponse(data, table);
    }
    case "propagation_events": {
      const { data, error } = await supabase
        .from("propagation_events")
        .select("*")
        .eq("owner_id", user.id);
      return error
        ? NextResponse.json({ error: error.message }, { status: 500 })
        : createCsvResponse(data, table);
    }
    case "observations": {
      const { data, error } = await supabase
        .from("observations")
        .select("*")
        .eq("owner_id", user.id);
      return error
        ? NextResponse.json({ error: error.message }, { status: 500 })
        : createCsvResponse(data, table);
    }
    case "activity_events": {
      const { data, error } = await supabase
        .from("activity_events")
        .select("*")
        .eq("owner_id", user.id);
      return error
        ? NextResponse.json({ error: error.message }, { status: 500 })
        : createCsvResponse(data, table);
    }
    case "media": {
      const { data, error } = await supabase
        .from("media")
        .select("*")
        .eq("owner_id", user.id);
      return error
        ? NextResponse.json({ error: error.message }, { status: 500 })
        : createCsvResponse(data, table);
    }
    case "transactions": {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("owner_id", user.id);
      return error
        ? NextResponse.json({ error: error.message }, { status: 500 })
        : createCsvResponse(data, table);
    }
    default:
      return NextResponse.json(
        { error: "지원하지 않는 CSV 항목입니다." },
        { status: 404 },
      );
  }
}
