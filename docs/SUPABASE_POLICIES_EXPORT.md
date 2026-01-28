# SUPABASE_POLICIES_EXPORT

Goal: export and version Supabase RLS + Storage policies as SQL in repo.

## Option A (Supabase Dashboard SQL Editor)

1) Open Supabase project -> SQL Editor.
2) Run the following query to list policies:
```
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
order by schemaname, tablename, policyname;
```
3) Copy results into a SQL file (see "Where to store" below).
4) For Storage-specific policies, filter schemaname = 'storage':
```
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'storage'
order by tablename, policyname;
```

## Option B (Supabase CLI)

1) Install and login:
```
supabase login
supabase link --project-ref <ref>
```
2) Dump schema including policies:
```
supabase db dump --schema public,storage,auth --file supabase/migrations/policies.sql
```
3) Commit the SQL file.

## Where to store

Recommended (pick one):
- `supabase/migrations/policies.sql` (preferred if using Supabase migrations)
- `docs/policies.sql` (docs-only archive)

## Notes
- This repo currently has no policy SQL committed (see docs/SYSTEM_MAP.md gaps).
- Keep policies versioned in repo so production changes are reviewable.
