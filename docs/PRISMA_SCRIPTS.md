# Prisma Scripts (DIRECT_URL)

## Why
Supabase PgBouncer session pools can exhaust quickly when scripts open too many clients.  
Scripts must connect **directly** (non‑pooled) using `DIRECT_URL`.

## Required env
- `DIRECT_URL` (direct database URL)
- `DATABASE_URL` (pooler URL for app/runtime)

## Usage
Scripts should use a dedicated PrismaClient configured with `DIRECT_URL`.

Example:
```
const prisma = new PrismaClient({
  datasourceUrl: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});
```

## Note
App runtime can keep using `DATABASE_URL` (pooler). Scripts must not import `lib/prisma`.
