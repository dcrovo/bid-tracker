create table if not exists public.opportunities (
  id text primary key,
  source text not null,
  source_id text not null unique,
  title text not null,
  entity text not null,
  department text not null,
  municipality text not null,
  modality text not null,
  contract_type text not null,
  estimated_value numeric not null default 0,
  publication_date timestamptz not null,
  deadline timestamptz not null,
  status text not null default 'Nuevo',
  process_state text not null,
  official_url text not null,
  keywords text[] not null default '{}',
  raw_payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fit_scores (
  opportunity_id text primary key references public.opportunities(id) on delete cascade,
  score integer not null,
  level text not null,
  reasons text[] not null default '{}',
  risks text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  opportunity_id text not null,
  name text not null,
  document_type text not null,
  source_url text not null,
  storage_path text,
  extraction_status text not null default 'pending',
  extracted_text text,
  extracted_at timestamptz,
  extraction_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_extractions (
  id uuid primary key default gen_random_uuid(),
  opportunity_id text not null,
  summary text,
  requirements jsonb not null default '[]',
  model text,
  created_at timestamptz not null default now()
);

create table if not exists public.company_profile (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  services text[] not null default '{}',
  target_departments text[] not null default '{}',
  preferred_modalities text[] not null default '{}',
  min_value numeric not null default 0,
  max_value numeric not null default 0,
  positive_keywords text[] not null default '{}',
  excluded_keywords text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists opportunities_deadline_idx on public.opportunities(deadline);
create index if not exists opportunities_department_idx on public.opportunities(department);
create index if not exists opportunities_status_idx on public.opportunities(status);
create unique index if not exists documents_opportunity_source_unique on public.documents(opportunity_id, source_url);
create index if not exists documents_opportunity_idx on public.documents(opportunity_id);
create index if not exists documents_status_idx on public.documents(extraction_status);
create index if not exists ai_extractions_opportunity_idx on public.ai_extractions(opportunity_id);
create index if not exists opportunities_search_idx on public.opportunities using gin (
  to_tsvector('spanish', coalesce(title, '') || ' ' || coalesce(entity, '') || ' ' || coalesce(municipality, ''))
);


-- Security: public schema tables must have RLS enabled in Supabase.
-- The app currently writes through server-side API routes using SUPABASE_SECRET_KEY.
-- No anon/authenticated policies are created yet, so browser clients cannot read or mutate these tables directly.
alter table public.opportunities enable row level security;
alter table public.fit_scores enable row level security;
alter table public.documents enable row level security;
alter table public.ai_extractions enable row level security;
alter table public.company_profile enable row level security;

-- Keep the API surface closed by default. These statements are idempotent and remove
-- accidental permissive policies if this script is rerun during early setup.
drop policy if exists "public read opportunities" on public.opportunities;
drop policy if exists "public write opportunities" on public.opportunities;
drop policy if exists "public read fit_scores" on public.fit_scores;
drop policy if exists "public write fit_scores" on public.fit_scores;
drop policy if exists "public read documents" on public.documents;
drop policy if exists "public write documents" on public.documents;
drop policy if exists "public read ai_extractions" on public.ai_extractions;
drop policy if exists "public write ai_extractions" on public.ai_extractions;
drop policy if exists "public read company_profile" on public.company_profile;
drop policy if exists "public write company_profile" on public.company_profile;


-- Storage bucket for downloaded opportunity documents. Private by default.
insert into storage.buckets (id, name, public)
values ('opportunity-documents', 'opportunity-documents', false)
on conflict (id) do nothing;
