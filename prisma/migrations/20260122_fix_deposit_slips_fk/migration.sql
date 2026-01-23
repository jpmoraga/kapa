-- Fix deposit_slips_user_id_fkey to match schema (ON UPDATE NO ACTION)
-- Idempotent: no-op if already correct.

DO $$
DECLARE
  fk_def text;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO fk_def
  FROM pg_constraint
  WHERE conrelid = 'public.deposit_slips'::regclass
    AND contype = 'f'
    AND conname = 'deposit_slips_user_id_fkey';

  IF fk_def IS NULL THEN
    ALTER TABLE public.deposit_slips
      ADD CONSTRAINT deposit_slips_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES "User"(id)
      ON DELETE CASCADE ON UPDATE NO ACTION;
  ELSIF fk_def ILIKE '%ON UPDATE CASCADE%'
     OR fk_def NOT LIKE 'FOREIGN KEY (user_id) REFERENCES "User"(id)%' THEN
    ALTER TABLE public.deposit_slips
      DROP CONSTRAINT deposit_slips_user_id_fkey;

    ALTER TABLE public.deposit_slips
      ADD CONSTRAINT deposit_slips_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES "User"(id)
      ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;
END $$;
