-- Adds document extraction fields and storage support for pliego intelligence.
alter table public.documents
  add column if not exists extraction_status text not null default 'pending',
  add column if not exists extracted_text text,
  add column if not exists extracted_at timestamptz,
  add column if not exists extraction_error text,
  add column if not exists created_at timestamptz not null default now();

create unique index if not exists documents_opportunity_source_unique
  on public.documents(opportunity_id, source_url);

create index if not exists documents_opportunity_idx
  on public.documents(opportunity_id);

create index if not exists documents_status_idx
  on public.documents(extraction_status);

insert into storage.buckets (id, name, public)
values ('opportunity-documents', 'opportunity-documents', false)
on conflict (id) do nothing;
