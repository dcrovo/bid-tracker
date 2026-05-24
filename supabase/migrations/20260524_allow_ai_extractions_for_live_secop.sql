-- Allows AI analyses for live SECOP opportunities before the opportunities table is fully persisted.
-- Run this once in Supabase SQL Editor if ai_extractions still has the old FK constraint.
alter table public.ai_extractions
  drop constraint if exists ai_extractions_opportunity_id_fkey;

alter table public.documents
  drop constraint if exists documents_opportunity_id_fkey;

create index if not exists ai_extractions_opportunity_idx on public.ai_extractions(opportunity_id);
