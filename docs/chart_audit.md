# BTC/CLP Chart Audit

## Model + source of truth
- Prisma model: `MarketTrade`
- Table name: `"MarketTrade"` (no `@@map`)
- Unique key: `marketId + timeMs + price + amount + direction`
- Chart component: `components/landing/BtcClpChart.tsx`
- Data route: `app/api/market/line/route.ts`

## Audit results (local DB)
- Market: `btc-clp`
- Total trades stored: `2056`
- Oldest trade: `2026-01-15T20:08:36.983Z`
- Newest trade: `2026-01-23T03:26:22.351Z`
- History span: `7.30 days (175.30h)`
- Last 500 span: `38.47h`
- Duplicates: `0`

Trades per day:
- 2026-01-15: 48
- 2026-01-16: 224
- 2026-01-17: 146
- 2026-01-18: 180
- 2026-01-19: 333
- 2026-01-20: 457
- 2026-01-21: 374
- 2026-01-22: 252
- 2026-01-23: 42

## Diagnosis: why the chart shows ~38h
- The chart fetches `/api/market/line?limit=500`.
- The last 500 trades only span `38.47h`, even though the DB has `7.30` days of history.
- So the chart can only render ~38h of data with the current limit.
- The previous "empty history" issue was caused by an early stub return in `app/api/market/line/route.ts`; that has been removed so DB points now return correctly.

## Ingestion status
- `/api/market/line` does a best-effort sync of the **last 500** Buda trades on each request.
- `/api/market/sync-trades` can sync up to `limit=2000`, but it only runs when called (or via `/api/cron/sync-trades`).
- There is **no backfill/pagination** and no guaranteed periodic job unless the cron is configured and running.

## Time-series correctness
- Points are sorted ascending by timestamp and use `price` as the value.
- `timeMs` is converted to seconds (UTC epoch), so no local timezone shift is applied.
- Candles are built by epoch-second buckets:
  - Open = first trade in bucket
  - High/Low = max/min in bucket
  - Close = last trade in bucket

## External sanity check (Buda ticker)
- Latest trade price: `77,944,092`
- Buda last_price: `78,945,294`
- Diff: `-1.2682%`

Interpretation: the DB is likely **not in sync with the latest trades**, so the last trade can drift from live ticker values.

## Conclusion / fix options
- **Not a chart bug**: the 38h window is due to the `limit=500` fetch size and no scheduled accumulation.
- If you want true multi-day coverage (7D/30D):
  - Option A: run `/api/cron/sync-trades` on a schedule and raise the chart fetch limit (e.g. 2000+).
  - Option B: implement paginated backfill until X days, then incremental sync.
  - Option C: store OHLC candles per interval to keep long history without huge trade counts.
