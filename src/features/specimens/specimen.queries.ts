import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function getOwnedSpecimens() {
  if (!getSupabaseConfig()) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("specimens")
    .select(
      "id, code, genotype_id, propagation_method, status, started_at, visibility",
    )
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getActiveSpecimens() {
  if (!getSupabaseConfig()) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("specimens")
    .select("id, code, genotype_id, propagation_method, status")
    .eq("status", "active")
    .is("archived_at", null)
    .order("code");

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getOwnedSpecimenDetails(specimenId: string) {
  if (!getSupabaseConfig()) {
    return null;
  }

  const supabase = await createClient();
  const { data: specimen, error: specimenError } = await supabase
    .from("specimens")
    .select(
      "id, code, genotype_id, propagation_method, status, acquired_at, started_at, ended_at, visibility, created_at",
    )
    .eq("id", specimenId)
    .is("archived_at", null)
    .maybeSingle();

  if (specimenError) {
    throw new Error(specimenError.message);
  }

  if (!specimen) {
    return null;
  }

  const [
    genotypeResult,
    activityResult,
    observationResult,
    propagationResult,
    transactionResult,
    mediaResult,
  ] = await Promise.all([
    supabase
      .from("genotypes")
      .select("id, code, display_name")
      .eq("id", specimen.genotype_id)
      .maybeSingle(),
    supabase
      .from("activity_events")
      .select("id, kind, occurred_at, notes, metadata")
      .eq("specimen_id", specimen.id)
      .order("occurred_at", { ascending: false }),
    supabase
      .from("observations")
      .select(
        "id, observed_at, leaf_sequence, leaf_length_mm, leaf_width_mm, vigor, notes",
      )
      .eq("specimen_id", specimen.id)
      .order("observed_at", { ascending: false }),
    supabase
      .from("propagation_events")
      .select(
        "id, source_specimen_id, target_specimen_id, method, propagated_at, notes",
      )
      .or(
        `source_specimen_id.eq.${specimen.id},target_specimen_id.eq.${specimen.id}`,
      )
      .order("propagated_at", { ascending: false }),
    supabase
      .from("transactions")
      .select(
        "id, kind, transacted_at, counterparty, amount, currency, notes",
      )
      .eq("specimen_id", specimen.id)
      .order("transacted_at", { ascending: false }),
    supabase
      .from("media")
      .select("id, kind, object_path, captured_at, alt_text, caption, visibility")
      .eq("specimen_id", specimen.id)
      .order("created_at", { ascending: false }),
  ]);

  const firstError = [
    genotypeResult.error,
    activityResult.error,
    observationResult.error,
    propagationResult.error,
    transactionResult.error,
    mediaResult.error,
  ].find((error) => error !== null);

  if (firstError) {
    throw new Error(firstError.message);
  }

  return {
    specimen,
    genotype: genotypeResult.data,
    activityEvents: activityResult.data ?? [],
    observations: observationResult.data ?? [],
    propagationEvents: propagationResult.data ?? [],
    transactions: transactionResult.data ?? [],
    media: mediaResult.data ?? [],
  };
}

export async function getOwnedPropagationEvents() {
  if (!getSupabaseConfig()) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("propagation_events")
    .select(
      "id, genotype_id, source_specimen_id, target_specimen_id, method, propagated_at, notes",
    )
    .order("propagated_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
