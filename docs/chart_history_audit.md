# BTC/CLP Chart History Audit

## Ingestion path (authoritative)
- Storage model: `MarketTrade` (table `"MarketTrade"`)
  - Fields: `marketId`, `timeMs`, `price`, `amount`, `direction`
  - Unique key: `marketId + timeMs + price + amount + direction`
- Ingestion endpoints:
  - `app/api/market/line/route.ts`  
    - Best-effort fetch of **last 500** Buda trades per request.
    - Inserts into `MarketTrade` with `skipDuplicates`.
    - Returns points for chart (limited by `?limit=`).
  - `app/api/market/sync-trades/route.ts`  
    - Manual sync endpoint, default `limit=2000`.
  - `app/api/cron/sync-trades/route.ts`  
    - Cron wrapper that calls `/api/market/sync-trades` (requires `CRON_SECRET`).

## DB coverage (btc-clp)
Audit run: `node scripts/audit_market_trades.js btc-clp --ticker`

- Total trades stored: **2239**
- Oldest trade: **2026-01-15T20:08:36.983Z**
- Newest trade: **2026-01-23T18:42:18.723Z**
- History span: **7.94 days (190.56h)**
- Last 500 trades span: **43.81h**
- Duplicates: **0 (0.0000%)**
- Avg trades/day (last 30d): **74.63**

Trades per day (last 30d):
- 2025-12-24: 0
- 2025-12-25: 0
- 2025-12-26: 0
- 2025-12-27: 0
- 2025-12-28: 0
- 2025-12-29: 0
- 2025-12-30: 0
- 2025-12-31: 0
- 2026-01-01: 0
- 2026-01-02: 0
- 2026-01-03: 0
- 2026-01-04: 0
- 2026-01-05: 0
- 2026-01-06: 0
- 2026-01-07: 0
- 2026-01-08: 0
- 2026-01-09: 0
- 2026-01-10: 0
- 2026-01-11: 0
- 2026-01-12: 0
- 2026-01-13: 0
- 2026-01-14: 48
- 2026-01-15: 224
- 2026-01-16: 146
- 2026-01-17: 180
- 2026-01-18: 333
- 2026-01-19: 457
- 2026-01-20: 374
- 2026-01-21: 252
- 2026-01-22: 225

## Why 30D is not showing
- The chart fetches `/api/market/line?limit=500`.
- **500 trades only span ~44 hours** at current volume.
- UI disables 30D when `availableSeconds < 30D`, so 30D is unavailable.
- DB itself has **only ~8 days** of history, so 30D cannot be fulfilled anyway.

## Sanity check (price vs Buda)
- Latest DB trade price: **79,252,872.9**
- Buda last_price: **79,122,473**
- Diff: **0.1648%**

Interpretation: DB prices are close enough; candle derivation is based on raw trades and uses epoch timestamps (UTC), so no timezone shift.

## Root diagnosis
- Not a chart bug. The limit of **500 trades** caps the time window.
- Ingestion is only run when the line endpoint is hit (or if the cron is configured and running).
- There is **no backfill or pagination**, so older history is missing.

## Recommended next steps
A) **Start fresh but correct**  
- Clear only `MarketTrade` (keep `PriceSnapshot`) and run `/api/market/sync-trades` on a schedule to accumulate history.

B) **Keep history**  
- Ensure `/api/cron/sync-trades` is wired to a real cron schedule.
- Increase the fetch limit used by `/api/market/line` (or fetch more on the server).
- Optional: implement paginated backfill or aggregate OHLC tables for long-term history.
