-- sync_manual_changes
-- This migration syncs manual DB changes that were applied outside Prisma Migrate.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) deposit_slips (idempotent)
CREATE TABLE IF NOT EXISTS public.deposit_slips (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  file_path text NOT NULL,
  file_mime text,
  file_size_bytes bigint,
  declared_amount_clp bigint,
  ocr_status text NOT NULL DEFAULT 'received',
  ocr_text text,
  parsed_amount_clp bigint,
  bank_hint text,
  status text NOT NULL DEFAULT 'received',
  notes text,
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  updated_at timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT deposit_slips_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS deposit_slips_created_at_idx ON public.deposit_slips (created_at);
CREATE INDEX IF NOT EXISTS deposit_slips_status_idx ON public.deposit_slips (status);
CREATE INDEX IF NOT EXISTS deposit_slips_user_id_idx ON public.deposit_slips (user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'deposit_slips_user_id_fkey'
      AND conrelid = 'public.deposit_slips'::regclass
  ) THEN
    ALTER TABLE public.deposit_slips
      ADD CONSTRAINT deposit_slips_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES "User"(id)
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- 2) paidOut/paidOutAt on TreasuryMovement (idempotent)
ALTER TABLE "TreasuryMovement"
  ADD COLUMN IF NOT EXISTS "paidOut" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "paidOutAt" timestamptz;
