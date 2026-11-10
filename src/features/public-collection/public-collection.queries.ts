import { createClient } from "@/lib/supabase/server";

export async function getPublicGenotypes(ownerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("genotypes")
    .select(
      "id, code, display_name, kind, generation, breeder_name, provenance_grade, published_at",
    )
    .eq("owner_id", ownerId)
    .eq("visibility", "public")
    .not("published_at", "is", null)
    .is("archived_at", null)
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getPublicGenotype(ownerId: string, code: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("genotypes")
    .select(
      "id, code, display_name, kind, generation, breeder_name, provenance_grade, provenance_notes, origin_cross_id, published_at",
    )
    .eq("owner_id", ownerId)
    .eq("code", code)
    .eq("visibility", "public")
    .not("published_at", "is", null)
    .is("archived_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getPublicGenotypeDetails(
  ownerId: string,
  genotypeId: string,
) {
  const supabase = await createClient();
  const specimensPromise = supabase
    .from("specimens")
    .select("id, code, propagation_method, status, started_at")
    .eq("owner_id", ownerId)
    .eq("genotype_id", genotypeId)
    .eq("visibility", "public")
    .not("published_at", "is", null)
    .is("archived_at", null);
  const crossesPromise = supabase
    .from("crosses")
    .select(
      "id, code, seed_parent_genotype_id, pollen_parent_genotype_id, generation, status",
    )
    .eq("owner_id", ownerId)
    .eq("visibility", "public")
    .not("published_at", "is", null)
    .or(
      `seed_parent_genotype_id.eq.${genotypeId},pollen_parent_genotype_id.eq.${genotypeId}`,
    );

  const [specimensResult, crossesResult] = await Promise.all([
    specimensPromise,
    crossesPromise,
  ]);

  if (specimensResult.error) {
    throw new Error(specimensResult.error.message);
  }

  if (crossesResult.error) {
    throw new Error(crossesResult.error.message);
  }

  return {
    specimens: specimensResult.data,
    crosses: crossesResult.data,
  };
}

export async function getPublicCross(ownerId: string, code: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crosses")
    .select(
      "id, code, seed_parent_genotype_id, pollen_parent_genotype_id, generation, status, pollinated_at, harvested_at, seed_count, germinated_count, notes, published_at",
    )
    .eq("owner_id", ownerId)
    .eq("code", code)
    .eq("visibility", "public")
    .not("published_at", "is", null)
    .is("archived_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getPublicCrossDetails(
  ownerId: string,
  crossId: string,
  parentIds: readonly string[],
) {
  const supabase = await createClient();
  const [parentResult, offspringResult, activityResult] = await Promise.all([
    parentIds.length > 0
      ? supabase
          .from("genotypes")
          .select("id, code, display_name, kind, provenance_grade")
          .eq("owner_id", ownerId)
          .eq("visibility", "public")
          .not("published_at", "is", null)
          .in("id", [...parentIds])
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("genotypes")
      .select(
        "id, code, display_name, kind, generation, provenance_grade, published_at",
      )
      .eq("owner_id", ownerId)
      .eq("origin_cross_id", crossId)
      .eq("visibility", "public")
      .not("published_at", "is", null)
      .is("archived_at", null)
      .order("created_at"),
    supabase
      .from("activity_events")
      .select("id, kind, occurred_at, notes")
      .eq("owner_id", ownerId)
      .eq("cross_id", crossId)
      .eq("visibility", "public")
      .not("published_at", "is", null)
      .order("occurred_at", { ascending: false }),
  ]);

  const firstError = [
    parentResult.error,
    offspringResult.error,
    activityResult.error,
  ].find((error) => error !== null);

  if (firstError) {
    throw new Error(firstError.message);
  }

  return {
    parents: parentResult.data ?? [],
    offspring: offspringResult.data ?? [],
    activityEvents: activityResult.data ?? [],
  };
}

export async function getPublicSpecimen(ownerId: string, code: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("specimens")
    .select(
      "id, genotype_id, code, propagation_method, status, acquired_at, started_at, ended_at, published_at",
    )
    .eq("owner_id", ownerId)
    .eq("code", code)
    .eq("visibility", "public")
    .not("published_at", "is", null)
    .is("archived_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getPublicSpecimenDetails(
  ownerId: string,
  specimenId: string,
  genotypeId: string,
) {
  const supabase = await createClient();
  const [genotypeResult, observationResult, activityResult, mediaResult] =
    await Promise.all([
      supabase
        .from("genotypes")
        .select("id, code, display_name, kind, generation, provenance_grade")
        .eq("owner_id", ownerId)
        .eq("id", genotypeId)
        .eq("visibility", "public")
        .not("published_at", "is", null)
        .maybeSingle(),
      supabase
        .from("observations")
        .select(
          "id, observed_at, leaf_sequence, leaf_length_mm, leaf_width_mm, vigor, notes",
        )
        .eq("owner_id", ownerId)
        .eq("specimen_id", specimenId)
        .eq("visibility", "public")
        .not("published_at", "is", null)
        .order("observed_at", { ascending: false }),
      supabase
        .from("activity_events")
        .select("id, kind, occurred_at, notes")
        .eq("owner_id", ownerId)
        .eq("specimen_id", specimenId)
        .eq("visibility", "public")
        .not("published_at", "is", null)
        .order("occurred_at", { ascending: false }),
      supabase
        .from("media")
        .select("id, kind, bucket_id, object_path, captured_at, alt_text, caption")
        .eq("owner_id", ownerId)
        .eq("specimen_id", specimenId)
        .eq("visibility", "public")
        .not("published_at", "is", null)
        .order("created_at", { ascending: false }),
    ]);

  const firstError = [
    genotypeResult.error,
    observationResult.error,
    activityResult.error,
    mediaResult.error,
  ].find((error) => error !== null);

  if (firstError) {
    throw new Error(firstError.message);
  }

  return {
    genotype: genotypeResult.data,
    observations: observationResult.data ?? [],
    activityEvents: activityResult.data ?? [],
    media: mediaResult.data ?? [],
  };
}
