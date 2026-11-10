create function public.create_cross_seedling(
  source_cross_id uuid,
  genotype_code text,
  genotype_display_name text,
  specimen_code text,
  germinated_at date,
  provenance_grade public.provenance_grade default 'U',
  target_visibility public.visibility default 'private'
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  cross_record public.crosses%rowtype;
  target_genotype_id uuid;
  target_kind public.genotype_kind;
begin
  select *
  into cross_record
  from public.crosses
  where id = source_cross_id
    and owner_id = (select auth.uid())
    and archived_at is null;

  if not found then
    raise exception '교배 기록을 찾을 수 없거나 접근 권한이 없습니다.';
  end if;

  target_kind := case
    when cross_record.seed_parent_genotype_id is not null
      and cross_record.seed_parent_genotype_id = cross_record.pollen_parent_genotype_id
      then 'selfed_seedling'::public.genotype_kind
    else 'cross_seedling'::public.genotype_kind
  end;

  insert into public.genotypes (
    owner_id,
    origin_cross_id,
    code,
    display_name,
    kind,
    generation,
    provenance_grade,
    visibility,
    published_at
  )
  values (
    cross_record.owner_id,
    cross_record.id,
    genotype_code,
    genotype_display_name,
    target_kind,
    cross_record.generation,
    provenance_grade,
    target_visibility,
    case
      when target_visibility = 'public' then timezone('utc', now())
      else null
    end
  )
  returning id into target_genotype_id;

  insert into public.specimens (
    owner_id,
    genotype_id,
    code,
    propagation_method,
    status,
    started_at,
    visibility,
    published_at
  )
  values (
    cross_record.owner_id,
    target_genotype_id,
    specimen_code,
    'seed',
    'active',
    germinated_at,
    target_visibility,
    case
      when target_visibility = 'public' then timezone('utc', now())
      else null
    end
  );

  update public.crosses
  set
    germinated_count = coalesce(cross_record.germinated_count, 0) + 1,
    status = case
      when status in ('planned', 'pollinated', 'developing', 'harvested')
        then 'germinating'::public.cross_status
      else status
    end
  where id = cross_record.id;

  return target_genotype_id;
end;
$$;

grant execute on function public.create_cross_seedling(
  uuid,
  text,
  text,
  text,
  date,
  public.provenance_grade,
  public.visibility
) to authenticated;
