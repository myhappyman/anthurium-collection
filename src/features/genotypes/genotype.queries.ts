import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function getOwnedGenotypes() {
  if (!getSupabaseConfig()) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("genotypes")
    .select(
      "id, code, display_name, kind, generation, provenance_grade, visibility",
    )
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getOwnedGenotypeDetails(genotypeId: string) {
  if (!getSupabaseConfig()) {
    return null;
  }

  const supabase = await createClient();
  const { data: genotype, error: genotypeError } = await supabase
    .from("genotypes")
    .select(
      "id, catalog_node_id, origin_cross_id, code, display_name, kind, generation, breeder_name, provenance_grade, provenance_notes, visibility, created_at",
    )
    .eq("id", genotypeId)
    .is("archived_at", null)
    .maybeSingle();

  if (genotypeError) {
    throw new Error(genotypeError.message);
  }

  if (!genotype) {
    return null;
  }

  const [
    specimenResult,
    originCrossResult,
    parentCrossResult,
    activityResult,
    mediaResult,
  ] = await Promise.all([
    supabase
      .from("specimens")
      .select(
        "id, code, propagation_method, status, started_at, ended_at, visibility",
      )
      .eq("genotype_id", genotype.id)
      .is("archived_at", null)
      .order("created_at"),
    genotype.origin_cross_id
      ? supabase
          .from("crosses")
          .select(
            "id, code, seed_parent_genotype_id, pollen_parent_genotype_id, generation, status",
          )
          .eq("id", genotype.origin_cross_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("crosses")
      .select(
        "id, code, seed_parent_genotype_id, pollen_parent_genotype_id, generation, status",
      )
      .or(
        `seed_parent_genotype_id.eq.${genotype.id},pollen_parent_genotype_id.eq.${genotype.id}`,
      )
      .is("archived_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("activity_events")
      .select("id, kind, occurred_at, notes")
      .eq("genotype_id", genotype.id)
      .order("occurred_at", { ascending: false }),
    supabase
      .from("media")
      .select("id, kind, object_path, captured_at, alt_text, caption, visibility")
      .eq("genotype_id", genotype.id)
      .order("created_at", { ascending: false }),
  ]);

  const firstError = [
    specimenResult.error,
    originCrossResult.error,
    parentCrossResult.error,
    activityResult.error,
    mediaResult.error,
  ].find((error) => error !== null);

  if (firstError) {
    throw new Error(firstError.message);
  }

  return {
    genotype,
    specimens: specimenResult.data ?? [],
    originCross: originCrossResult.data,
    parentCrosses: parentCrossResult.data ?? [],
    activityEvents: activityResult.data ?? [],
    media: mediaResult.data ?? [],
  };
}
