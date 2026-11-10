import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function getOwnedTransactions() {
  if (!getSupabaseConfig()) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(
      "id, specimen_id, kind, transacted_at, counterparty, amount, currency",
    )
    .order("transacted_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
