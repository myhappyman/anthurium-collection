import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function getOwnedCrosses() {
  if (!getSupabaseConfig()) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crosses")
    .select(
      "id, code, seed_parent_genotype_id, pollen_parent_genotype_id, generation, status, pollinated_at, seed_count, germinated_count, visibility",
    )
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getOwnedCrossDetails(crossId: string) {
  if (!getSupabaseConfig()) {
    return null;
  }

  const supabase = await createClient();
  const { data: cross, error: crossError } = await supabase
    .from("crosses")
    .select(
      "id, code, seed_parent_genotype_id, pollen_parent_genotype_id, generation, status, pollinated_at, harvested_at, seed_count, germinated_count, notes, visibility, created_at",
    )
    .eq("id", crossId)
    .is("archived_at", null)
    .maybeSingle();

  if (crossError) {
    throw new Error(crossError.message);
  }

  if (!cross) {
    return null;
  }

  const parentIds = [
    cross.seed_parent_genotype_id,
    cross.pollen_parent_genotype_id,
  ].filter((value): value is string => value !== null);
  const [parentResult, offspringResult, activityResult, mediaResult] =
    await Promise.all([
      parentIds.length > 0
        ? supabase
            .from("genotypes")
            .select("id, code, display_name, kind, provenance_grade")
            .in("id", parentIds)
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from("genotypes")
        .select(
          "id, code, display_name, kind, generation, provenance_grade, visibility",
        )
        .eq("origin_cross_id", cross.id)
        .is("archived_at", null)
        .order("created_at"),
      supabase
        .from("activity_events")
        .select("id, kind, occurred_at, notes")
        .eq("cross_id", cross.id)
        .order("occurred_at", { ascending: false }),
      supabase
        .from("media")
        .select("id, kind, object_path, captured_at, alt_text, caption, visibility")
        .eq("cross_id", cross.id)
        .order("created_at", { ascending: false }),
    ]);

  const firstError = [
    parentResult.error,
    offspringResult.error,
    activityResult.error,
    mediaResult.error,
  ].find((error) => error !== null);

  if (firstError) {
    throw new Error(firstError.message);
  }

  const parents = parentResult.data ?? [];

  return {
    cross,
    seedParent:
      parents.find((parent) => parent.id === cross.seed_parent_genotype_id) ??
      null,
    pollenParent:
      parents.find((parent) => parent.id === cross.pollen_parent_genotype_id) ??
      null,
    offspring: offspringResult.data ?? [],
    activityEvents: activityResult.data ?? [],
    media: mediaResult.data ?? [],
  };
}
