# CTO_INDEX

This index links all system documentation generated from the repo. If something could not be inferred, it is listed under "Gaps".

## Core docs
- SYSTEM MAP: docs/SYSTEM_MAP.md
- DB schema: docs/DB_SCHEMA.md
- Environment map: docs/ENV_MAP.md
- Storage map: docs/STORAGE_MAP.md
- Flows (end-to-end): docs/FLOWS.md
- Uploads audit: docs/UPLOADS_AUDIT.md
- Production runbook: docs/PROD_RUNBOOK.md
- Supabase policies export: docs/SUPABASE_POLICIES_EXPORT.md

## Supporting docs
- Email troubleshooting: docs/EMAIL_TROUBLESHOOT.md
- Prisma scripts: docs/PRISMA_SCRIPTS.md
- Chart audits: docs/chart_audit.md, docs/chart_history_audit.md
- Performance report: docs/performance_report.md
- Env audit snapshot: ENV_AUDIT.md

## Gaps / Not found (from repo scan)
- Vercel cron schedule config (vercel.json or other scheduler config not found).
- Supabase RLS/Storage policies are not stored in repo (see docs/SUPABASE_POLICIES_EXPORT.md).
- Storage bucket policies/ACLs not documented in code.

If you add missing configs, update the corresponding doc and remove the gap.
