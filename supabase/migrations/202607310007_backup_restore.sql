create function public.restore_collection_backup(backup_data jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_owner_id uuid := (select auth.uid());
begin
  if current_owner_id is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if backup_data ->> 'schemaVersion' <> '1' then
    raise exception '지원하지 않는 백업 스키마 버전입니다.';
  end if;

  if jsonb_typeof(backup_data -> 'genotypes') <> 'array'
    or jsonb_typeof(backup_data -> 'specimens') <> 'array'
    or jsonb_typeof(backup_data -> 'crosses') <> 'array'
    or jsonb_typeof(backup_data -> 'propagationEvents') <> 'array'
    or jsonb_typeof(backup_data -> 'observations') <> 'array'
    or jsonb_typeof(backup_data -> 'activityEvents') <> 'array'
    or jsonb_typeof(backup_data -> 'media') <> 'array'
    or jsonb_typeof(backup_data -> 'transactions') <> 'array'
  then
    raise exception '백업 데이터의 필수 배열이 누락되었습니다.';
  end if;

  if exists (
    select 1 from public.genotypes where owner_id = current_owner_id
    union all
    select 1 from public.specimens where owner_id = current_owner_id
    union all
    select 1 from public.crosses where owner_id = current_owner_id
  ) then
    raise exception '복원은 유전 개체·화분·교배 기록이 없는 계정에서만 가능합니다.';
  end if;

  perform set_config('app.restoring_backup', 'true', true);

  if backup_data -> 'profile' is not null
    and jsonb_typeof(backup_data -> 'profile') = 'object'
  then
    insert into public.profiles (
      id,
      handle,
      display_name,
      bio,
      avatar_path,
      is_public,
      created_at,
      updated_at
    )
    select
      current_owner_id,
      profile_record.handle,
      profile_record.display_name,
      profile_record.bio,
      profile_record.avatar_path,
      profile_record.is_public,
      profile_record.created_at,
      profile_record.updated_at
    from jsonb_to_record(backup_data -> 'profile') as profile_record(
      handle text,
      display_name text,
      bio text,
      avatar_path text,
      is_public boolean,
      created_at timestamptz,
      updated_at timestamptz
    )
    on conflict (id) do update
    set
      handle = excluded.handle,
      display_name = excluded.display_name,
      bio = excluded.bio,
      avatar_path = excluded.avatar_path,
      is_public = excluded.is_public,
      updated_at = excluded.updated_at;
  end if;

  insert into public.genotypes (
    id,
    owner_id,
    catalog_node_id,
    origin_cross_id,
    code,
    display_name,
    kind,
    generation,
    breeder_name,
    provenance_grade,
    provenance_notes,
    visibility,
    published_at,
    created_at,
    updated_at,
    archived_at
  )
  select
    genotype_record.id,
    current_owner_id,
    null,
    null,
    genotype_record.code,
    genotype_record.display_name,
    genotype_record.kind,
    genotype_record.generation,
    genotype_record.breeder_name,
    genotype_record.provenance_grade,
    genotype_record.provenance_notes,
    genotype_record.visibility,
    genotype_record.published_at,
    genotype_record.created_at,
    genotype_record.updated_at,
    genotype_record.archived_at
  from jsonb_to_recordset(backup_data -> 'genotypes') as genotype_record(
    id uuid,
    code text,
    display_name text,
    kind public.genotype_kind,
    generation text,
    breeder_name text,
    provenance_grade public.provenance_grade,
    provenance_notes text,
    visibility public.visibility,
    published_at timestamptz,
    created_at timestamptz,
    updated_at timestamptz,
    archived_at timestamptz
  );

  insert into public.crosses (
    id,
    owner_id,
    code,
    seed_parent_genotype_id,
    pollen_parent_genotype_id,
    generation,
    status,
    pollinated_at,
    harvested_at,
    seed_count,
    germinated_count,
    notes,
    visibility,
    published_at,
    created_at,
    updated_at,
    archived_at
  )
  select
    cross_record.id,
    current_owner_id,
    cross_record.code,
    cross_record.seed_parent_genotype_id,
    cross_record.pollen_parent_genotype_id,
    cross_record.generation,
    cross_record.status,
    cross_record.pollinated_at,
    cross_record.harvested_at,
    cross_record.seed_count,
    cross_record.germinated_count,
    cross_record.notes,
    cross_record.visibility,
    cross_record.published_at,
    cross_record.created_at,
    cross_record.updated_at,
    cross_record.archived_at
  from jsonb_to_recordset(backup_data -> 'crosses') as cross_record(
    id uuid,
    seed_parent_genotype_id uuid,
    pollen_parent_genotype_id uuid,
    code text,
    generation text,
    status public.cross_status,
    pollinated_at date,
    harvested_at date,
    seed_count integer,
    germinated_count integer,
    notes text,
    visibility public.visibility,
    published_at timestamptz,
    created_at timestamptz,
    updated_at timestamptz,
    archived_at timestamptz
  );

  update public.genotypes as target
  set origin_cross_id = source.origin_cross_id
  from jsonb_to_recordset(backup_data -> 'genotypes') as source(
    id uuid,
    origin_cross_id uuid
  )
  where target.id = source.id
    and target.owner_id = current_owner_id;

  insert into public.specimens (
    id,
    owner_id,
    genotype_id,
    code,
    propagation_method,
    status,
    acquired_at,
    started_at,
    ended_at,
    visibility,
    published_at,
    created_at,
    updated_at,
    archived_at
  )
  select
    specimen_record.id,
    current_owner_id,
    specimen_record.genotype_id,
    specimen_record.code,
    specimen_record.propagation_method,
    specimen_record.status,
    specimen_record.acquired_at,
    specimen_record.started_at,
    specimen_record.ended_at,
    specimen_record.visibility,
    specimen_record.published_at,
    specimen_record.created_at,
    specimen_record.updated_at,
    specimen_record.archived_at
  from jsonb_to_recordset(backup_data -> 'specimens') as specimen_record(
    id uuid,
    genotype_id uuid,
    code text,
    propagation_method public.propagation_method,
    status public.specimen_status,
    acquired_at date,
    started_at date,
    ended_at date,
    visibility public.visibility,
    published_at timestamptz,
    created_at timestamptz,
    updated_at timestamptz,
    archived_at timestamptz
  );

  insert into public.propagation_events (
    id,
    owner_id,
    genotype_id,
    source_specimen_id,
    target_specimen_id,
    method,
    propagated_at,
    notes,
    created_at
  )
  select
    propagation_record.id,
    current_owner_id,
    propagation_record.genotype_id,
    propagation_record.source_specimen_id,
    propagation_record.target_specimen_id,
    propagation_record.method,
    propagation_record.propagated_at,
    propagation_record.notes,
    propagation_record.created_at
  from jsonb_to_recordset(
    backup_data -> 'propagationEvents'
  ) as propagation_record(
    id uuid,
    genotype_id uuid,
    source_specimen_id uuid,
    target_specimen_id uuid,
    method public.propagation_method,
    propagated_at date,
    notes text,
    created_at timestamptz
  );

  insert into public.observations (
    id,
    owner_id,
    specimen_id,
    observed_at,
    leaf_sequence,
    leaf_length_mm,
    leaf_width_mm,
    petiole_length_mm,
    internode_length_mm,
    emergent_color,
    mature_color,
    vein_description,
    sinus_description,
    texture,
    vigor,
    notes,
    visibility,
    published_at,
    created_at,
    updated_at
  )
  select
    observation_record.id,
    current_owner_id,
    observation_record.specimen_id,
    observation_record.observed_at,
    observation_record.leaf_sequence,
    observation_record.leaf_length_mm,
    observation_record.leaf_width_mm,
    observation_record.petiole_length_mm,
    observation_record.internode_length_mm,
    observation_record.emergent_color,
    observation_record.mature_color,
    observation_record.vein_description,
    observation_record.sinus_description,
    observation_record.texture,
    observation_record.vigor,
    observation_record.notes,
    observation_record.visibility,
    observation_record.published_at,
    observation_record.created_at,
    observation_record.updated_at
  from jsonb_to_recordset(backup_data -> 'observations') as observation_record(
    id uuid,
    specimen_id uuid,
    observed_at date,
    leaf_sequence integer,
    leaf_length_mm numeric,
    leaf_width_mm numeric,
    petiole_length_mm numeric,
    internode_length_mm numeric,
    emergent_color text,
    mature_color text,
    vein_description text,
    sinus_description text,
    texture text,
    vigor smallint,
    notes text,
    visibility public.visibility,
    published_at timestamptz,
    created_at timestamptz,
    updated_at timestamptz
  );

  insert into public.activity_events (
    id,
    owner_id,
    genotype_id,
    specimen_id,
    cross_id,
    kind,
    occurred_at,
    notes,
    metadata,
    corrects_event_id,
    visibility,
    published_at,
    created_at
  )
  select
    activity_record.id,
    current_owner_id,
    activity_record.genotype_id,
    activity_record.specimen_id,
    activity_record.cross_id,
    activity_record.kind,
    activity_record.occurred_at,
    activity_record.notes,
    activity_record.metadata,
    null,
    activity_record.visibility,
    activity_record.published_at,
    activity_record.created_at
  from jsonb_to_recordset(
    backup_data -> 'activityEvents'
  ) as activity_record(
    id uuid,
    genotype_id uuid,
    specimen_id uuid,
    cross_id uuid,
    kind public.event_kind,
    occurred_at timestamptz,
    notes text,
    metadata jsonb,
    visibility public.visibility,
    published_at timestamptz,
    created_at timestamptz
  );

  update public.activity_events as target
  set corrects_event_id = source.corrects_event_id
  from jsonb_to_recordset(backup_data -> 'activityEvents') as source(
    id uuid,
    corrects_event_id uuid
  )
  where target.id = source.id
    and target.owner_id = current_owner_id;

  insert into public.media (
    id,
    owner_id,
    genotype_id,
    specimen_id,
    cross_id,
    observation_id,
    kind,
    bucket_id,
    object_path,
    captured_at,
    alt_text,
    caption,
    visibility,
    published_at,
    created_at
  )
  select
    media_record.id,
    current_owner_id,
    media_record.genotype_id,
    media_record.specimen_id,
    media_record.cross_id,
    media_record.observation_id,
    media_record.kind,
    media_record.bucket_id,
    media_record.object_path,
    media_record.captured_at,
    media_record.alt_text,
    media_record.caption,
    media_record.visibility,
    media_record.published_at,
    media_record.created_at
  from jsonb_to_recordset(backup_data -> 'media') as media_record(
    id uuid,
    genotype_id uuid,
    specimen_id uuid,
    cross_id uuid,
    observation_id uuid,
    kind public.media_kind,
    bucket_id text,
    object_path text,
    captured_at timestamptz,
    alt_text text,
    caption text,
    visibility public.visibility,
    published_at timestamptz,
    created_at timestamptz
  );

  insert into public.transactions (
    id,
    owner_id,
    specimen_id,
    kind,
    transacted_at,
    counterparty,
    amount,
    currency,
    notes,
    created_at,
    updated_at
  )
  select
    transaction_record.id,
    current_owner_id,
    transaction_record.specimen_id,
    transaction_record.kind,
    transaction_record.transacted_at,
    transaction_record.counterparty,
    transaction_record.amount,
    transaction_record.currency,
    transaction_record.notes,
    transaction_record.created_at,
    transaction_record.updated_at
  from jsonb_to_recordset(
    backup_data -> 'transactions'
  ) as transaction_record(
    id uuid,
    specimen_id uuid,
    kind public.transaction_kind,
    transacted_at date,
    counterparty text,
    amount numeric,
    currency char(3),
    notes text,
    created_at timestamptz,
    updated_at timestamptz
  );

  return jsonb_build_object(
    'genotypes',
    jsonb_array_length(backup_data -> 'genotypes'),
    'specimens',
    jsonb_array_length(backup_data -> 'specimens'),
    'crosses',
    jsonb_array_length(backup_data -> 'crosses'),
    'observations',
    jsonb_array_length(backup_data -> 'observations')
  );
end;
$$;

grant execute on function public.restore_collection_backup(jsonb)
to authenticated;
