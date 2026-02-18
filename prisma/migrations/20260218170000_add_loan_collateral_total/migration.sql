-- Add collateralSatsTotal to Loan and backfill from LoanCollateral
ALTER TABLE "Loan" ADD COLUMN "collateralSatsTotal" BIGINT NOT NULL DEFAULT 0;

UPDATE "Loan" AS l
SET "collateralSatsTotal" = COALESCE(
  (
    SELECT SUM(c."amountSats")
    FROM "LoanCollateral" AS c
    WHERE c."loanId" = l."id"
  ),
  0
);
