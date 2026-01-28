# DB_SCHEMA

Source files:
- prisma/schema.prisma
- prisma/migrations/*/migration.sql

Notes:
- Models without @@map use quoted table names in Postgres (e.g., "TreasuryMovement").
- @map on fields indicates a column name override.

## Migrations
- 20251212175204_init: -- CreateTable
- 20251212184223_fix_companyuser_pk: /*
- 20251212200414_add_person_profile: -- CreateTable
- 20251212205247_treasury_one_to_one: /*
- 20251212213819_add_active_company: -- AlterTable
- 20251213133252_add_treasury_movements: -- CreateTable
- 20251213140441_add_personal_account_kind: /*
- 20251214194110_multi_asset_accounts: /*
- 20251214204240_add_price_snapshot: -- CreateTable
- 20251215135416_treasury_approvals: -- CreateEnum
- 20251217020829_add_executed_price_to_treasury_movement: -- AlterTable
- 20251217041911_onboarding_and_executed_price: -- AlterTable
- 20251217071924_add_user_onboarding: -- CreateTable
- 20251222220809_add_processing_status: -- AlterEnum
- 20251222224940_phase2a_buda_execution_fields: -- AlterTable
- 20251223204503_add_internal_movement_state: -- CreateEnum
- 20251228193134_add_market_trades: -- CreateTable
- 20251229185553_add_cron_run: -- CreateTable
- 20251231160455_add_bank_account: -- CreateTable
- 20260118134922_add_personprofile_fields: /*
- 20260118144935_add_id_document_front_back: /*
- 20260118173519_add_id_document_paths: -- AlterTable
- 20260121214031_sync_manual_changes: -- sync_manual_changes
- 20260122230047_add_insufficient_liquidity_reason: -- AlterEnum
- 20260122_baseline_email_verification: -- Baseline for email verification + user emailVerifiedAt + deposit_slips FK
- 20260122_fix_deposit_slips_fk: -- Fix deposit_slips_user_id_fkey to match schema (ON UPDATE NO ACTION)

## Enums
### CompanyKind
- PERSONAL
- BUSINESS

### AssetCode
- BTC
- CLP
- USD

### InternalMovementState
- NONE
- WAITING_LIQUIDITY
- WAITING_BANK_TOPUP
- WAITING_MIN_SIZE_AGGREGATION
- RETRYING_BUDA
- MANUAL_REVIEW
- FAILED_TEMPORARY

### InternalMovementReason
- NONE
- INSUFFICIENT_LIQUIDITY
- BELOW_BUDA_MIN
- BUDA_INSUFFICIENT_FUNDS
- BUDA_API_ERROR
- PRICE_MISSING
- UNKNOWN

### TreasuryMovementStatus
- PENDING
- APPROVED
- REJECTED
- PROCESSING

## Models
### User
- Table: User

| Field | Type | Nullable | Default | Map | Attributes |
| --- | --- | --- | --- | --- | --- |
| id | String | no | @default(cuid()) |  | @id @default(cuid()) |
| email | String | no |  |  | @unique |
| passwordHash | String | no |  |  |  |
| createdAt | DateTime | no | @default(now()) |  | @default(now()) |
| activeCompanyId | String? | yes |  |  |  |
| emailVerifiedAt | DateTime? | yes |  |  | @db.Timestamp(6) |
| emailVerificationToken | EmailVerificationToken? | yes |  |  |  |
| bankAccount | BankAccount? | yes |  |  |  |
| personalCompany | Company? | yes |  |  | @relation("PersonalCompany") |
| companyUsers | CompanyUser[] | no |  |  |  |
| personProfile | PersonProfile? | yes |  |  |  |
| sessions | Session[] | no |  |  |  |
| approvedTreasuryMovements | TreasuryMovement[] | no |  |  | @relation("TreasuryMovementApprovedBy") |
| createdTreasuryMovements | TreasuryMovement[] | no |  |  | @relation("TreasuryMovementCreatedBy") |
| activeCompany | Company? | yes |  |  | @relation("ActiveCompany", fields: [activeCompanyId], references: [id]) |
| depositSlips | DepositSlip[] | no |  |  |  |
| onboarding | UserOnboarding? | yes |  |  |  |

### PersonProfile
- Table: PersonProfile
- Table indexes: @@index([rut])

| Field | Type | Nullable | Default | Map | Attributes |
| --- | --- | --- | --- | --- | --- |
| userId | String | no |  |  | @id |
| fullName | String? | yes |  |  |  |
| rut | String? | yes |  |  |  |
| phone | String? | yes |  |  |  |
| createdAt | DateTime | no | @default(now()) |  | @default(now()) |
| updatedAt | DateTime | no |  |  | @updatedAt |
| birthDate | String? | yes |  |  |  |
| documentSerial | String? | yes |  |  |  |
| nationality | String? | yes |  |  |  |
| idDocumentBackPath | String? | yes |  |  |  |
| idDocumentFrontPath | String? | yes |  |  |  |
| user | User | no |  |  | @relation(fields: [userId], references: [id], onDelete: Cascade) |

### BankAccount
- Table: BankAccount
- Table indexes: @@index([holderRut])

| Field | Type | Nullable | Default | Map | Attributes |
| --- | --- | --- | --- | --- | --- |
| id | String | no | @default(cuid()) |  | @id @default(cuid()) |
| userId | String | no |  |  | @unique |
| bankName | String | no |  |  |  |
| accountType | String | no |  |  |  |
| accountNumber | String | no |  |  |  |
| holderRut | String | no |  |  |  |
| createdAt | DateTime | no | @default(now()) |  | @default(now()) |
| user | User | no |  |  | @relation(fields: [userId], references: [id], onDelete: Cascade) |

### Session
- Table: Session

| Field | Type | Nullable | Default | Map | Attributes |
| --- | --- | --- | --- | --- | --- |
| id | String | no | @default(cuid()) |  | @id @default(cuid()) |
| sessionToken | String | no |  |  | @unique |
| userId | String | no |  |  |  |
| expires | DateTime | no |  |  |  |
| user | User | no |  |  | @relation(fields: [userId], references: [id], onDelete: Cascade) |

### Company
- Table: Company

| Field | Type | Nullable | Default | Map | Attributes |
| --- | --- | --- | --- | --- | --- |
| id | String | no | @default(cuid()) |  | @id @default(cuid()) |
| name | String | no |  |  |  |
| kind | CompanyKind | no | @default(BUSINESS) |  | @default(BUSINESS) |
| personalOwnerId | String? | yes |  |  | @unique |
| companyRut | String? | yes |  |  |  |
| fundsDeclAcceptedAt | DateTime? | yes |  |  |  |
| onboardingCompleted | Boolean | no | @default(false) |  | @default(false) |
| privacyAcceptedAt | DateTime? | yes |  |  |  |
| termsAcceptedAt | DateTime? | yes |  |  |  |
| personalOwner | User? | yes |  |  | @relation("PersonalCompany", fields: [personalOwnerId], references: [id], onDelete: Cascade) |
| members | CompanyUser[] | no |  |  |  |
| treasury | TreasuryAccount[] | no |  |  |  |
| movements | TreasuryMovement[] | no |  |  |  |
| activeUsers | User[] | no |  |  | @relation("ActiveCompany") |

### CompanyUser
- Table: CompanyUser
- Table PK: @@id([userId, companyId])

| Field | Type | Nullable | Default | Map | Attributes |
| --- | --- | --- | --- | --- | --- |
| userId | String | no |  |  |  |
| companyId | String | no |  |  |  |
| role | String | no |  |  |  |
| company | Company | no |  |  | @relation(fields: [companyId], references: [id], onDelete: Cascade) |
| user | User | no |  |  | @relation(fields: [userId], references: [id], onDelete: Cascade) |

### TreasuryAccount
- Table: TreasuryAccount
- Table uniques: @@unique([companyId, assetCode])
- Table indexes: @@index([companyId])

| Field | Type | Nullable | Default | Map | Attributes |
| --- | --- | --- | --- | --- | --- |
| id | String | no | @default(cuid()) |  | @id @default(cuid()) |
| companyId | String | no |  |  |  |
| balance | Decimal | no | @default(0) |  | @default(0) |
| assetCode | AssetCode | no | @default(BTC) |  | @default(BTC) |
| company | Company | no |  |  | @relation(fields: [companyId], references: [id], onDelete: Cascade) |

### TreasuryMovement
- Table: TreasuryMovement
- Table indexes: @@index([companyId, createdAt]); @@index([companyId, assetCode, createdAt]); @@index([companyId, status, createdAt])

| Field | Type | Nullable | Default | Map | Attributes |
| --- | --- | --- | --- | --- | --- |
| id | String | no | @default(cuid()) |  | @id @default(cuid()) |
| companyId | String | no |  |  |  |
| amount | Decimal | no |  |  |  |
| type | String | no |  |  |  |
| note | String? | yes |  |  |  |
| createdAt | DateTime | no | @default(now()) |  | @default(now()) |
| assetCode | AssetCode | no | @default(BTC) |  | @default(BTC) |
| approvedAt | DateTime? | yes |  |  |  |
| approvedByUserId | String? | yes |  |  |  |
| attachmentUrl | String? | yes |  |  |  |
| createdByUserId | String? | yes |  |  |  |
| status | TreasuryMovementStatus | no | @default(PENDING) |  | @default(PENDING) |
| executedAt | DateTime? | yes |  |  |  |
| executedPrice | Decimal? | yes |  |  |  |
| executedQuoteCode | AssetCode? | yes |  |  |  |
| executedSource | String? | yes |  |  |  |
| executedBaseAmount | Decimal? | yes |  |  |  |
| executedFeeAmount | Decimal? | yes |  |  |  |
| executedFeeCode | AssetCode? | yes |  |  |  |
| executedQuoteAmount | Decimal? | yes |  |  |  |
| externalOrderId | String? | yes |  |  |  |
| externalVenue | String? | yes |  |  |  |
| internalNote | String? | yes |  |  |  |
| internalReason | InternalMovementReason | no | @default(NONE) |  | @default(NONE) |
| internalState | InternalMovementState | no | @default(NONE) |  | @default(NONE) |
| lastError | String? | yes |  |  |  |
| nextRetryAt | DateTime? | yes |  |  |  |
| retryCount | Int | no | @default(0) |  | @default(0) |
| paidOut | Boolean | no | @default(false) |  | @default(false) |
| paidOutAt | DateTime? | yes |  |  | @db.Timestamptz(6) |
| approvedBy | User? | yes |  |  | @relation("TreasuryMovementApprovedBy", fields: [approvedByUserId], references: [id]) |
| company | Company | no |  |  | @relation(fields: [companyId], references: [id], onDelete: Cascade) |
| createdBy | User? | yes |  |  | @relation("TreasuryMovementCreatedBy", fields: [createdByUserId], references: [id]) |

### PriceSnapshot
- Table: PriceSnapshot
- Table indexes: @@index([assetCode, quoteCode, createdAt])

| Field | Type | Nullable | Default | Map | Attributes |
| --- | --- | --- | --- | --- | --- |
| id | String | no | @default(cuid()) |  | @id @default(cuid()) |
| assetCode | AssetCode | no |  |  |  |
| quoteCode | AssetCode | no |  |  |  |
| price | Decimal | no |  |  |  |
| source | String | no |  |  |  |
| createdAt | DateTime | no | @default(now()) |  | @default(now()) |

### UserOnboarding
- Table: user_onboarding
- Table map: @@map("user_onboarding")

| Field | Type | Nullable | Default | Map | Attributes |
| --- | --- | --- | --- | --- | --- |
| userId | String | no |  |  | @id |
| termsAcceptedAt | DateTime? | yes |  |  |  |
| createdAt | DateTime | no | @default(now()) |  | @default(now()) |
| updatedAt | DateTime | no |  |  | @updatedAt |
| idDocumentBackPath | String? | yes |  |  |  |
| idDocumentFrontPath | String? | yes |  |  |  |
| user | User | no |  |  | @relation(fields: [userId], references: [id], onDelete: Cascade) |

### MarketTrade
- Table: MarketTrade
- Table uniques: @@unique([marketId, timeMs, price, amount, direction])
- Table indexes: @@index([marketId, timeMs])

| Field | Type | Nullable | Default | Map | Attributes |
| --- | --- | --- | --- | --- | --- |
| id | String | no | @default(cuid()) |  | @id @default(cuid()) |
| marketId | String | no |  |  |  |
| timeMs | BigInt | no |  |  |  |
| price | Decimal | no |  |  |  |
| amount | Decimal | no |  |  |  |
| direction | String | no |  |  |  |
| createdAt | DateTime | no | @default(now()) |  | @default(now()) |

### CronRun
- Table: CronRun
- Table indexes: @@index([job, createdAt]); @@index([marketId, createdAt])

| Field | Type | Nullable | Default | Map | Attributes |
| --- | --- | --- | --- | --- | --- |
| id | String | no | @default(cuid()) |  | @id @default(cuid()) |
| job | String | no |  |  |  |
| marketId | String | no |  |  |  |
| ok | Boolean | no |  |  |  |
| inserted | Int | no |  |  |  |
| error | String? | yes |  |  |  |
| startedAt | DateTime | no |  |  |  |
| finishedAt | DateTime | no |  |  |  |
| createdAt | DateTime | no | @default(now()) |  | @default(now()) |

### DepositSlip
- Table: deposit_slips
- Table map: @@map("deposit_slips")
- Table indexes: @@index([createdAt]); @@index([status]); @@index([userId])

| Field | Type | Nullable | Default | Map | Attributes |
| --- | --- | --- | --- | --- | --- |
| id | String | no | @default(dbgenerated("gen_random_uuid()")) |  | @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid |
| userId | String | no |  | user_id | @map("user_id") |
| filePath | String | no |  | file_path | @map("file_path") |
| fileMime | String? | yes |  | file_mime | @map("file_mime") |
| fileSizeBytes | BigInt? | yes |  | file_size_bytes | @map("file_size_bytes") |
| declaredAmountClp | BigInt? | yes |  | declared_amount_clp | @map("declared_amount_clp") |
| ocrStatus | String | no | @default("received") | ocr_status | @default("received") @map("ocr_status") |
| ocrText | String? | yes |  | ocr_text | @map("ocr_text") |
| parsedAmountClp | BigInt? | yes |  | parsed_amount_clp | @map("parsed_amount_clp") |
| bankHint | String? | yes |  | bank_hint | @map("bank_hint") |
| status | String | no | @default("received") |  | @default("received") |
| notes | String? | yes |  |  |  |
| createdAt | DateTime | no | @default(now()) | created_at | @default(now()) @map("created_at") @db.Timestamptz(6) |
| updatedAt | DateTime | no | @default(now()) | updated_at | @default(now()) @map("updated_at") @db.Timestamptz(6) |
| user | User | no |  |  | @relation(fields: [userId], references: [id], onDelete: Cascade, onUpdate: NoAction) |

### EmailVerificationToken
- Table: EmailVerificationToken

| Field | Type | Nullable | Default | Map | Attributes |
| --- | --- | --- | --- | --- | --- |
| id | String | no | @default(cuid()) |  | @id @default(cuid()) |
| userId | String | no |  |  | @unique |
| token | String | no |  |  | @unique |
| expiresAt | DateTime | no |  |  | @db.Timestamptz(6) |
| createdAt | DateTime | no | @default(now()) |  | @default(now()) @db.Timestamptz(6) |
| user | User | no |  |  | @relation(fields: [userId], references: [id], onDelete: Cascade) |
