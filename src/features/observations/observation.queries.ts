import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function getOwnedObservations() {
  if (!getSupabaseConfig()) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("observations")
    .select(
      "id, specimen_id, observed_at, leaf_sequence, leaf_length_mm, leaf_width_mm, vigor, visibility",
    )
    .order("observed_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
