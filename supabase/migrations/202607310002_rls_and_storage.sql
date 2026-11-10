alter table public.profiles enable row level security;
alter table public.catalog_nodes enable row level security;
alter table public.catalog_edges enable row level security;
alter table public.genotypes enable row level security;
alter table public.crosses enable row level security;
alter table public.specimens enable row level security;
alter table public.specimen_private_details enable row level security;
alter table public.propagation_events enable row level security;
alter table public.observations enable row level security;
alter table public.activity_events enable row level security;
alter table public.media enable row level security;
alter table public.transactions enable row level security;

create policy "public profiles are readable"
on public.profiles for select
to anon, authenticated
using (is_public or id = (select auth.uid()));

create policy "owners insert their profile"
on public.profiles for insert
to authenticated
with check (id = (select auth.uid()));

create policy "owners update their profile"
on public.profiles for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "published catalog nodes are readable"
on public.catalog_nodes for select
to anon, authenticated
using (
  (visibility = 'public' and published_at is not null and archived_at is null)
  or owner_id = (select auth.uid())
);

create policy "owners create catalog nodes"
on public.catalog_nodes for insert
to authenticated
with check (owner_id = (select auth.uid()));

create policy "owners update catalog nodes"
on public.catalog_nodes for update
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy "read visible catalog edges"
on public.catalog_edges for select
to anon, authenticated
using (
  exists (
    select 1
    from public.catalog_nodes parent_node
    join public.catalog_nodes child_node on child_node.id = catalog_edges.child_node_id
    where parent_node.id = catalog_edges.parent_node_id
      and (
        (
          parent_node.visibility = 'public'
          and parent_node.published_at is not null
          and child_node.visibility = 'public'
          and child_node.published_at is not null
        )
        or parent_node.owner_id = (select auth.uid())
        or child_node.owner_id = (select auth.uid())
      )
  )
);

create policy "owners create catalog edges"
on public.catalog_edges for insert
to authenticated
with check (
  exists (
    select 1 from public.catalog_nodes
    where catalog_nodes.id = catalog_edges.child_node_id
      and catalog_nodes.owner_id = (select auth.uid())
  )
);

create policy "owners delete catalog edges"
on public.catalog_edges for delete
to authenticated
using (
  exists (
    select 1 from public.catalog_nodes
    where catalog_nodes.id = catalog_edges.child_node_id
      and catalog_nodes.owner_id = (select auth.uid())
  )
);

create policy "visible genotypes are readable"
on public.genotypes for select
to anon, authenticated
using (
  owner_id = (select auth.uid())
  or (visibility = 'public' and published_at is not null and archived_at is null)
);

create policy "owners create genotypes"
on public.genotypes for insert
to authenticated
with check (owner_id = (select auth.uid()));

create policy "owners update genotypes"
on public.genotypes for update
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy "visible crosses are readable"
on public.crosses for select
to anon, authenticated
using (
  owner_id = (select auth.uid())
  or (visibility = 'public' and published_at is not null and archived_at is null)
);

create policy "owners create crosses"
on public.crosses for insert
to authenticated
with check (owner_id = (select auth.uid()));

create policy "owners update crosses"
on public.crosses for update
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy "visible specimens are readable"
on public.specimens for select
to anon, authenticated
using (
  owner_id = (select auth.uid())
  or (visibility = 'public' and published_at is not null and archived_at is null)
);

create policy "owners create specimens"
on public.specimens for insert
to authenticated
with check (owner_id = (select auth.uid()));

create policy "owners update specimens"
on public.specimens for update
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy "owners manage private specimen details"
on public.specimen_private_details
for all
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy "owners read propagation events"
on public.propagation_events for select
to authenticated
using (owner_id = (select auth.uid()));

create policy "owners create propagation events"
on public.propagation_events for insert
to authenticated
with check (owner_id = (select auth.uid()));

create policy "visible observations are readable"
on public.observations for select
to anon, authenticated
using (
  owner_id = (select auth.uid())
  or (visibility = 'public' and published_at is not null)
);

create policy "owners create observations"
on public.observations for insert
to authenticated
with check (owner_id = (select auth.uid()));

create policy "owners update observations"
on public.observations for update
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy "visible activity events are readable"
on public.activity_events for select
to anon, authenticated
using (
  owner_id = (select auth.uid())
  or (visibility = 'public' and published_at is not null)
);

create policy "owners create activity events"
on public.activity_events for insert
to authenticated
with check (owner_id = (select auth.uid()));

create policy "visible media metadata is readable"
on public.media for select
to anon, authenticated
using (
  owner_id = (select auth.uid())
  or (
    visibility = 'public'
    and published_at is not null
    and bucket_id = 'public-media'
  )
);

create policy "owners create media metadata"
on public.media for insert
to authenticated
with check (owner_id = (select auth.uid()));

create policy "owners update media metadata"
on public.media for update
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy "owners manage transactions"
on public.transactions
for all
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'public-media',
  'public-media',
  true,
  26214400,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'private-evidence',
  'private-evidence',
  false,
  26214400,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

create policy "owners upload public media"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'public-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "owners read public media metadata"
on storage.objects for select
to authenticated
using (
  bucket_id = 'public-media'
  and owner_id = (select auth.uid())::text
);

create policy "owners update public media"
on storage.objects for update
to authenticated
using (
  bucket_id = 'public-media'
  and owner_id = (select auth.uid())::text
)
with check (
  bucket_id = 'public-media'
  and owner_id = (select auth.uid())::text
);

create policy "owners delete public media"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'public-media'
  and owner_id = (select auth.uid())::text
);

create policy "owners upload private evidence"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'private-evidence'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "owners read private evidence"
on storage.objects for select
to authenticated
using (
  bucket_id = 'private-evidence'
  and owner_id = (select auth.uid())::text
);

create policy "owners update private evidence"
on storage.objects for update
to authenticated
using (
  bucket_id = 'private-evidence'
  and owner_id = (select auth.uid())::text
)
with check (
  bucket_id = 'private-evidence'
  and owner_id = (select auth.uid())::text
);

create policy "owners delete private evidence"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'private-evidence'
  and owner_id = (select auth.uid())::text
);
