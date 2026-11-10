create extension if not exists pgcrypto;

create type public.visibility as enum ('private', 'unlisted', 'public');
create type public.catalog_node_kind as enum ('species', 'selection', 'hybrid');
create type public.catalog_relation_kind as enum ('cross', 'selection');
create type public.genotype_kind as enum (
  'species',
  'named_clone',
  'hybrid',
  'selfed_seedling',
  'cross_seedling',
  'selected_seedling',
  'reference_only',
  'unknown'
);
create type public.provenance_grade as enum ('A', 'B', 'C', 'D', 'U');
create type public.cross_status as enum (
  'planned',
  'pollinated',
  'developing',
  'harvested',
  'germinating',
  'completed',
  'failed',
  'cancelled'
);
create type public.specimen_status as enum (
  'active',
  'reserved',
  'listed',
  'sold',
  'transferred',
  'consumed',
  'died',
  'lost'
);
create type public.propagation_method as enum (
  'seed',
  'offset',
  'division',
  'stem_cut',
  'tissue_culture'
);
create type public.event_kind as enum (
  'acquired',
  'repotted',
  'relocated',
  'renamed',
  'identified',
  'flowered',
  'pollen_collected',
  'pollinated',
  'seed_harvested',
  'germinated',
  'propagated',
  'selected',
  'listed',
  'sold',
  'transferred',
  'died',
  'corrected'
);
create type public.media_kind as enum (
  'plant',
  'leaf',
  'inflorescence',
  'pollen',
  'seed',
  'provenance',
  'receipt',
  'other'
);
create type public.transaction_kind as enum (
  'purchase',
  'sale',
  'gift_received',
  'gift_sent',
  'trade'
);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-z0-9][a-z0-9_-]{2,31}$'),
  display_name text not null check (char_length(display_name) between 1 and 80),
  bio text check (bio is null or char_length(bio) <= 500),
  avatar_path text,
  is_public boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.catalog_nodes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  legacy_slug text not null unique,
  display_name text not null,
  scientific_name text,
  kind public.catalog_node_kind not null,
  abbreviations text[] not null default '{}',
  aliases text[] not null default '{}',
  description_ko text,
  traits jsonb not null default '{}'::jsonb,
  tags text[] not null default '{}',
  source_urls text[] not null default '{}',
  is_verified boolean not null default false,
  visibility public.visibility not null default 'public',
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  archived_at timestamptz,
  constraint catalog_nodes_publication_check check (
    visibility <> 'public' or published_at is not null
  )
);

create table public.catalog_edges (
  id uuid primary key default gen_random_uuid(),
  parent_node_id uuid not null references public.catalog_nodes(id) on delete restrict,
  child_node_id uuid not null references public.catalog_nodes(id) on delete restrict,
  relation_kind public.catalog_relation_kind not null,
  parent_role text check (parent_role is null or parent_role in ('seed', 'pollen')),
  created_at timestamptz not null default timezone('utc', now()),
  unique nulls not distinct (
    parent_node_id,
    child_node_id,
    relation_kind,
    parent_role
  ),
  check (parent_node_id <> child_node_id)
);

create table public.genotypes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  catalog_node_id uuid references public.catalog_nodes(id) on delete set null,
  code text not null,
  display_name text not null,
  kind public.genotype_kind not null,
  generation text,
  breeder_name text,
  provenance_grade public.provenance_grade not null default 'U',
  provenance_notes text,
  visibility public.visibility not null default 'private',
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  archived_at timestamptz,
  unique (owner_id, code),
  constraint genotypes_code_check check (code ~ '^[A-Z0-9][A-Z0-9-]{2,39}$'),
  constraint genotypes_publication_check check (
    visibility <> 'public' or published_at is not null
  )
);

create table public.crosses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  code text not null,
  seed_parent_genotype_id uuid references public.genotypes(id) on delete restrict,
  pollen_parent_genotype_id uuid references public.genotypes(id) on delete restrict,
  generation text,
  status public.cross_status not null default 'planned',
  pollinated_at date,
  harvested_at date,
  seed_count integer check (seed_count is null or seed_count >= 0),
  germinated_count integer check (germinated_count is null or germinated_count >= 0),
  notes text,
  visibility public.visibility not null default 'private',
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  archived_at timestamptz,
  unique (owner_id, code),
  constraint crosses_code_check check (code ~ '^CROSS-[0-9]{4}-[0-9]{3,}$'),
  constraint crosses_count_check check (
    germinated_count is null
    or seed_count is null
    or germinated_count <= seed_count
  ),
  constraint crosses_publication_check check (
    visibility <> 'public' or published_at is not null
  )
);

alter table public.genotypes
  add column origin_cross_id uuid references public.crosses(id) on delete set null;

create table public.specimens (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  genotype_id uuid not null references public.genotypes(id) on delete restrict,
  code text not null,
  propagation_method public.propagation_method not null,
  status public.specimen_status not null default 'active',
  acquired_at date,
  started_at date,
  ended_at date,
  visibility public.visibility not null default 'private',
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  archived_at timestamptz,
  unique (owner_id, code),
  constraint specimens_code_check check (code ~ '^PLT-[0-9]{4}-[0-9]{3,}$'),
  constraint specimens_date_check check (
    ended_at is null or started_at is null or ended_at >= started_at
  ),
  constraint specimens_publication_check check (
    visibility <> 'public' or published_at is not null
  )
);

create table public.specimen_private_details (
  specimen_id uuid primary key references public.specimens(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete restrict,
  precise_location text,
  pot_description text,
  substrate_description text,
  private_notes text,
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.propagation_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  genotype_id uuid not null references public.genotypes(id) on delete restrict,
  source_specimen_id uuid not null references public.specimens(id) on delete restrict,
  target_specimen_id uuid not null references public.specimens(id) on delete restrict,
  method public.propagation_method not null,
  propagated_at date not null,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (target_specimen_id),
  check (source_specimen_id <> target_specimen_id),
  check (method in ('offset', 'division', 'stem_cut', 'tissue_culture'))
);

create table public.observations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  specimen_id uuid not null references public.specimens(id) on delete restrict,
  observed_at date not null,
  leaf_sequence integer check (leaf_sequence is null or leaf_sequence > 0),
  leaf_length_mm numeric(7, 1) check (leaf_length_mm is null or leaf_length_mm > 0),
  leaf_width_mm numeric(7, 1) check (leaf_width_mm is null or leaf_width_mm > 0),
  petiole_length_mm numeric(7, 1) check (petiole_length_mm is null or petiole_length_mm > 0),
  internode_length_mm numeric(7, 1) check (internode_length_mm is null or internode_length_mm > 0),
  emergent_color text,
  mature_color text,
  vein_description text,
  sinus_description text,
  texture text,
  vigor smallint check (vigor is null or vigor between 1 and 5),
  notes text,
  visibility public.visibility not null default 'private',
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint observations_publication_check check (
    visibility <> 'public' or published_at is not null
  )
);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  genotype_id uuid references public.genotypes(id) on delete restrict,
  specimen_id uuid references public.specimens(id) on delete restrict,
  cross_id uuid references public.crosses(id) on delete restrict,
  kind public.event_kind not null,
  occurred_at timestamptz not null,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  corrects_event_id uuid references public.activity_events(id) on delete restrict,
  visibility public.visibility not null default 'private',
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint activity_events_subject_check check (
    num_nonnulls(genotype_id, specimen_id, cross_id) = 1
  ),
  constraint activity_events_correction_check check (
    kind = 'corrected' or corrects_event_id is null
  ),
  constraint activity_events_publication_check check (
    visibility <> 'public' or published_at is not null
  )
);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  genotype_id uuid references public.genotypes(id) on delete restrict,
  specimen_id uuid references public.specimens(id) on delete restrict,
  cross_id uuid references public.crosses(id) on delete restrict,
  observation_id uuid references public.observations(id) on delete restrict,
  kind public.media_kind not null,
  bucket_id text not null,
  object_path text not null,
  captured_at timestamptz,
  alt_text text,
  caption text,
  visibility public.visibility not null default 'private',
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique (bucket_id, object_path),
  constraint media_subject_check check (
    num_nonnulls(genotype_id, specimen_id, cross_id, observation_id) = 1
  ),
  constraint media_bucket_check check (
    bucket_id in ('public-media', 'private-evidence')
  ),
  constraint media_publication_check check (
    visibility <> 'public' or published_at is not null
  )
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  specimen_id uuid not null references public.specimens(id) on delete restrict,
  kind public.transaction_kind not null,
  transacted_at date not null,
  counterparty text,
  amount numeric(12, 2) check (amount is null or amount >= 0),
  currency char(3) check (currency is null or currency ~ '^[A-Z]{3}$'),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index catalog_nodes_search_idx
  on public.catalog_nodes using gin (
    to_tsvector(
      'simple',
      display_name || ' ' || coalesce(scientific_name, '') || ' '
      || array_to_string(abbreviations, ' ') || ' ' || array_to_string(aliases, ' ')
    )
  );
create index catalog_edges_parent_idx on public.catalog_edges(parent_node_id);
create index catalog_edges_child_idx on public.catalog_edges(child_node_id);
create index genotypes_owner_idx on public.genotypes(owner_id);
create index genotypes_catalog_node_idx on public.genotypes(catalog_node_id);
create index genotypes_origin_cross_idx on public.genotypes(origin_cross_id);
create index crosses_owner_idx on public.crosses(owner_id);
create index crosses_seed_parent_idx on public.crosses(seed_parent_genotype_id);
create index crosses_pollen_parent_idx on public.crosses(pollen_parent_genotype_id);
create index specimens_owner_idx on public.specimens(owner_id);
create index specimens_genotype_idx on public.specimens(genotype_id);
create index observations_specimen_date_idx on public.observations(specimen_id, observed_at desc);
create index activity_events_specimen_date_idx on public.activity_events(specimen_id, occurred_at desc);
create index activity_events_genotype_date_idx on public.activity_events(genotype_id, occurred_at desc);
create index media_specimen_idx on public.media(specimen_id);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();
create trigger catalog_nodes_set_updated_at
before update on public.catalog_nodes
for each row execute function public.set_updated_at();
create trigger genotypes_set_updated_at
before update on public.genotypes
for each row execute function public.set_updated_at();
create trigger crosses_set_updated_at
before update on public.crosses
for each row execute function public.set_updated_at();
create trigger specimens_set_updated_at
before update on public.specimens
for each row execute function public.set_updated_at();
create trigger specimen_private_details_set_updated_at
before update on public.specimen_private_details
for each row execute function public.set_updated_at();
create trigger observations_set_updated_at
before update on public.observations
for each row execute function public.set_updated_at();
create trigger transactions_set_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();
