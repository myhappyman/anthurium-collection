alter type public.event_kind add value if not exists 'status_changed';
alter type public.event_kind add value if not exists 'lost';

create function public.record_specimen_status_change(
  target_specimen_id uuid,
  target_status public.specimen_status,
  occurred_on date,
  change_notes text default null,
  related_transaction_kind public.transaction_kind default null,
  transaction_counterparty text default null,
  transaction_amount numeric default null,
  transaction_currency char(3) default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  specimen_record public.specimens%rowtype;
  activity_event_id uuid;
  activity_kind public.event_kind;
begin
  select *
  into specimen_record
  from public.specimens
  where id = target_specimen_id
    and owner_id = (select auth.uid())
    and archived_at is null
  for update;

  if not found then
    raise exception '화분을 찾을 수 없거나 접근 권한이 없습니다.';
  end if;

  if specimen_record.status = target_status then
    raise exception '현재 상태와 변경할 상태가 같습니다.';
  end if;

  if transaction_amount is not null and transaction_amount < 0 then
    raise exception '거래 금액은 0 이상이어야 합니다.';
  end if;

  if transaction_currency is not null and transaction_currency !~ '^[A-Z]{3}$' then
    raise exception '통화는 ISO 4217 형식의 영문 3자리여야 합니다.';
  end if;

  activity_kind := case target_status
    when 'sold' then 'sold'::public.event_kind
    when 'transferred' then 'transferred'::public.event_kind
    when 'died' then 'died'::public.event_kind
    when 'lost' then 'lost'::public.event_kind
    else 'status_changed'::public.event_kind
  end;

  update public.specimens
  set
    status = target_status,
    ended_at = case
      when target_status in ('sold', 'transferred', 'consumed', 'died', 'lost')
        then occurred_on
      else null
    end
  where id = specimen_record.id;

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
  values (
    specimen_record.owner_id,
    specimen_record.id,
    activity_kind,
    occurred_on::timestamptz,
    change_notes,
    jsonb_build_object(
      'previousStatus',
      specimen_record.status,
      'nextStatus',
      target_status
    ),
    specimen_record.visibility,
    case
      when specimen_record.visibility = 'public' then timezone('utc', now())
      else null
    end
  )
  returning id into activity_event_id;

  if related_transaction_kind is not null then
    insert into public.transactions (
      owner_id,
      specimen_id,
      kind,
      transacted_at,
      counterparty,
      amount,
      currency,
      notes
    )
    values (
      specimen_record.owner_id,
      specimen_record.id,
      related_transaction_kind,
      occurred_on,
      transaction_counterparty,
      transaction_amount,
      transaction_currency,
      change_notes
    );
  end if;

  return activity_event_id;
end;
$$;

grant execute on function public.record_specimen_status_change(
  uuid,
  public.specimen_status,
  date,
  text,
  public.transaction_kind,
  text,
  numeric,
  char
) to authenticated;
