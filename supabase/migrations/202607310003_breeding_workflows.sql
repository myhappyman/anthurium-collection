create function public.create_clonal_specimen(
  source_specimen_id uuid,
  target_code text,
  propagation_method public.propagation_method,
  propagated_at date,
  target_visibility public.visibility default 'private',
  propagation_notes text default null,
  consume_source boolean default false
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  source_record public.specimens%rowtype;
  target_id uuid;
begin
  if propagation_method not in ('offset', 'division', 'stem_cut', 'tissue_culture') then
    raise exception '유효하지 않은 영양번식 방식입니다.';
  end if;

  select *
  into source_record
  from public.specimens
  where id = source_specimen_id
    and owner_id = (select auth.uid())
    and archived_at is null;

  if not found then
    raise exception '원본 화분을 찾을 수 없거나 접근 권한이 없습니다.';
  end if;

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
    source_record.owner_id,
    source_record.genotype_id,
    target_code,
    propagation_method,
    'active',
    propagated_at,
    target_visibility,
    case
      when target_visibility = 'public' then timezone('utc', now())
      else null
    end
  )
  returning id into target_id;

  insert into public.propagation_events (
    owner_id,
    genotype_id,
    source_specimen_id,
    target_specimen_id,
    method,
    propagated_at,
    notes
  )
  values (
    source_record.owner_id,
    source_record.genotype_id,
    source_record.id,
    target_id,
    propagation_method,
    propagated_at,
    propagation_notes
  );

  if consume_source then
    update public.specimens
    set
      status = 'consumed',
      ended_at = propagated_at
    where id = source_record.id;
  end if;

  return target_id;
end;
$$;

grant execute on function public.create_clonal_specimen(
  uuid,
  text,
  public.propagation_method,
  date,
  public.visibility,
  text,
  boolean
) to authenticated;
