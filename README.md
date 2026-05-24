# CAMOD Licitaciones

Internal bid intelligence app for CAMOD S.A.S. focused on Colombian public procurement opportunities in construction, architecture, consulting, design, studies, and interventoria.

## Stack

- Next.js 15, React, TypeScript
- Tailwind CSS
- Supabase Postgres/Auth-ready persistence
- SECOP II ingestion through datos.gov.co
- OpenAI Responses API health check, ready for document intelligence

## Local Setup

```bash
npm install
npm run dev -- --hostname 0.0.0.0
```

Open `http://localhost:3000`. If running inside Docker, forward container port `3000` to your host.

## Environment

Copy `.env.example` to `.env.local` and fill the values you want to enable.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
OPENAI_API_KEY=
OPENAI_HEALTH_MODEL=gpt-4.1-mini
SECOP_SOCRATA_APP_TOKEN=
```

Notes:

- `NEXT_PUBLIC_SUPABASE_URL` comes from Supabase Project Settings > API.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is the new `sb_publishable_...` key. It is safe for browser/client use.
- `SUPABASE_SECRET_KEY` is the new `sb_secret_...` key. It must stay server-side only and is used by Next.js API routes.
- Legacy `anon` and `service_role` keys still work as fallback env vars, but new projects should use publishable/secret keys.
- `OPENAI_API_KEY` comes from the OpenAI platform API keys page.
- `SECOP_SOCRATA_APP_TOKEN` is optional; live SECOP calls work without it, but a token can improve rate limits.

Restart the dev server after changing `.env.local`.

## Supabase Setup

1. Create a Supabase project, for example `camod-licitaciones`.
2. Open Supabase SQL Editor.
3. Run the full SQL script from `supabase/schema.sql`.
4. Add Supabase credentials to `.env.local` using the publishable and secret keys, not the legacy anon/service_role keys.
5. Start the app and verify:

```bash
curl http://localhost:3000/api/company-profile
```

Expected after credentials and schema are correct:

```json
{
  "source": "supabase",
  "profile": { ... }
}
```

If no CAMOD row exists yet, the route may return `source: "default"`. Go to `/profile`, edit the profile, click save, then call the endpoint again. It should persist in the `company_profile` table.

## Supabase RLS Security

All tables in the `public` schema have Row Level Security enabled in `supabase/schema.sql`:

- `opportunities`
- `fit_scores`
- `documents`
- `ai_extractions`
- `company_profile`

No public read/write policies are created yet. This is intentional for the internal MVP: browser clients should not query tables directly. The app reads/writes through server-side Next.js API routes using `SUPABASE_SECRET_KEY`, which bypasses RLS from trusted backend code.

When user login is added, create explicit policies for the `authenticated` role instead of opening tables to `anon`.

## Supabase Migrations

If you ran an older version of `supabase/schema.sql`, run this migration in Supabase SQL Editor before using AI analysis persistence:

```sql
-- supabase/migrations/20260524_allow_ai_extractions_for_live_secop.sql
alter table public.ai_extractions
  drop constraint if exists ai_extractions_opportunity_id_fkey;

alter table public.documents
  drop constraint if exists documents_opportunity_id_fkey;

create index if not exists ai_extractions_opportunity_idx on public.ai_extractions(opportunity_id);
```

This lets the app save analyses by SECOP source ID before the full opportunities table is persisted locally.

## OpenAI Setup

1. Create an OpenAI API key.
2. Add it to `.env.local` as `OPENAI_API_KEY`.
3. Keep `OPENAI_HEALTH_MODEL=gpt-4.1-mini` unless changing models intentionally.
4. Restart the app.
5. Verify:

```bash
curl http://localhost:3000/api/openai/health
```

Expected when configured correctly:

```json
{
  "configured": true,
  "ok": true,
  "model": "gpt-4.1-mini",
  "message": "OpenAI API key is configured and reachable."
}
```

If the key is missing, the endpoint returns `configured: false`. If the key is invalid or billing/project access is blocked, it returns `ok: false` with the OpenAI error message.

## Live SECOP Check

The app uses live SECOP II data by default with fallback handling.

```bash
curl 'http://localhost:3000/api/secop/opportunities?limit=5'
```

The response includes a `source` field:

- `secop`: live datos.gov.co / SECOP II data
- `fallback`: sample data because SECOP failed
- `sample`: sample data because no live results were available

## Verification

Run before committing or deploying:

```bash
npm test
npm run typecheck
npm run build
```

## Implementation Notes

- CAMOD scoring rules live in `src/lib/scoring.ts`.
- SECOP normalization lives in `src/lib/secop.ts`.
- Supabase server access lives in `src/lib/supabase-server.ts`.
- OpenAI health-check logic lives in `src/lib/openai-health.ts`.
- The next stage is persisting imported SECOP opportunities into Supabase and adding AI document extraction.
