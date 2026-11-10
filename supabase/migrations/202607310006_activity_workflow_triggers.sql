create function public.log_propagation_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  source_visibility public.visibility;
  target_visibility public.visibility;
begin
  if current_setting('app.restoring_backup', true) = 'true' then
    return new;
  end if;

  select visibility
  into source_visibility
  from public.specimens
  where id = new.source_specimen_id;

  select visibility
  into target_visibility
  from public.specimens
  where id = new.target_specimen_id;

  insert into public.activity_events (
    owner_id,
    specimen_id,
    kind,
    occurred_at,
    notes,
    metadata,
    visibility,
    published_at
  )
  values
    (
      new.owner_id,
      new.source_specimen_id,
      'propagated',
      new.propagated_at::timestamptz,
      new.notes,
      jsonb_build_object(
        'direction',
        'source',
        'targetSpecimenId',
        new.target_specimen_id,
        'method',
        new.method
      ),
      source_visibility,
      case
        when source_visibility = 'public' then timezone('utc', now())
        else null
      end
    ),
    (
      new.owner_id,
      new.target_specimen_id,
      'propagated',
      new.propagated_at::timestamptz,
      new.notes,
      jsonb_build_object(
        'direction',
        'target',
        'sourceSpecimenId',
        new.source_specimen_id,
        'method',
        new.method
      ),
      target_visibility,
      case
        when target_visibility = 'public' then timezone('utc', now())
        else null
      end
    );

  return new;
end;
$$;

create trigger propagation_activity_after_insert
after insert on public.propagation_events
for each row execute function public.log_propagation_activity();

create function public.log_seedling_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  genotype_record public.genotypes%rowtype;
begin
  if current_setting('app.restoring_backup', true) = 'true' then
    return new;
  end if;

  if new.propagation_method <> 'seed' then
    return new;
  end if;

  select *
  into genotype_record
  from public.genotypes
  where id = new.genotype_id
    and origin_cross_id is not null;

  if not found then
    return new;
  end if;

  insert into public.activity_events (
    owner_id,
    genotype_id,
    kind,
    occurred_at,
    metadata,
    visibility,
    published_at
  )
  select
    new.owner_id,
    genotype_record.id,
    'germinated',
    coalesce(new.started_at::timestamptz, new.created_at),
    jsonb_build_object(
      'originCrossId',
      genotype_record.origin_cross_id,
      'specimenId',
      new.id
    ),
    genotype_record.visibility,
    case
      when genotype_record.visibility = 'public' then timezone('utc', now())
      else null
    end
  where not exists (
    select 1
    from public.activity_events
    where genotype_id = genotype_record.id
      and kind = 'germinated'
  );

  insert into public.activity_events (
    owner_id,
    cross_id,
    kind,
    occurred_at,
    metadata,
    visibility,
    published_at
  )
  select
    new.owner_id,
    cross_record.id,
    'germinated',
    coalesce(new.started_at::timestamptz, new.created_at),
    jsonb_build_object(
      'offspringGenotypeId',
      genotype_record.id,
      'specimenId',
      new.id
    ),
    cross_record.visibility,
    case
      when cross_record.visibility = 'public' then timezone('utc', now())
      else null
    end
  from public.crosses as cross_record
  where cross_record.id = genotype_record.origin_cross_id
    and not exists (
      select 1
      from public.activity_events
      where cross_id = cross_record.id
        and kind = 'germinated'
        and metadata ->> 'offspringGenotypeId' = genotype_record.id::text
    );

  return new;
end;
$$;

create trigger seedling_activity_after_insert
after insert on public.specimens
for each row
when (new.propagation_method = 'seed')
execute function public.log_seedling_activity();

create function public.log_cross_creation_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if current_setting('app.restoring_backup', true) = 'true' then
    return new;
  end if;

  if new.pollinated_at is null then
    return new;
  end if;

  insert into public.activity_events (
    owner_id,
    cross_id,
    kind,
    occurred_at,
    notes,
    visibility,
    published_at
  )
  values (
    new.owner_id,
    new.id,
    'pollinated',
    new.pollinated_at::timestamptz,
    new.notes,
    new.visibility,
    case
      when new.visibility = 'public' then timezone('utc', now())
      else null
    end
  );

  return new;
end;
$$;

create trigger cross_creation_activity_after_insert
after insert on public.crosses
for each row execute function public.log_cross_creation_activity();
