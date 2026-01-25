# Performance Report (Onboarding + Dashboard)

## Scope
- Onboarding navigation: `/onboarding?step=ocr`, `personal`, `bank`, `terms`.
- Dashboard initial load + redirect.
- Excludes Buda API latency.

## Summary of Top Suspects (from code + instrumentation hooks)
1) **Server guard on every refresh**
   - `/onboarding` guard calls `getServerSession()` + `prisma.user.findUnique()` + `getOnboardingStatus()` (3 queries in a transaction).
   - Triggered on **every** `router.refresh()` from OCR/Personal/Bank/Terms.
   - Evidence: `lib/onboardingStatus.ts` always runs 3 queries; guard runs per refresh in `app/onboarding/page.tsx`.

2) **Multiple refreshes + redirects per step**
   - Each step uses `router.refresh()` after POST.
   - Server guard may redirect to `/onboarding?step=...` immediately after refresh.
   - This can cause a full server render + Suspense fallback (black/blank flash) if slow.

3) **Client + server work happens in series**
   - Step submit → API POST (DB write) → `router.refresh()` → server guard DB reads → render.
   - If any stage is slow (session lookup, DB RTT, transaction), user sees lag or fallback.

4) **Dashboard is server-heavy by default**
   - `/dashboard` runs `getServerSession`, user lookup, onboarding status, membership lookup, and a transaction with accounts + movements.
   - Additionally, `DashboardBonito` triggers `router.refresh()` every 10s and polls `/api/treasury/summary` every 8s (extra server load).

5) **Region mismatch risk**
   - If Vercel region ≠ Supabase region, each onboarding transition pays extra network latency for DB calls.
   - Verify Vercel region vs Supabase project region.

## Redirect / Refresh Map
### Server redirects
- `app/onboarding/page.tsx`
  - Redirect to `/auth/login` if no session or user.
  - Redirect to `/dashboard` if onboarding complete.
  - Redirect to `/onboarding?step=...` if step mismatch.
- `app/dashboard/page.tsx`
  - Redirect to `/auth/login` if no session.
  - Redirect to `/select-company` if no active company.
  - Redirect to `/onboarding` if onboarding incomplete.

### Client refresh / push
- `app/onboarding/ocr/page.tsx`: `router.refresh()` after profile save.
- `app/onboarding/personal/page.tsx`: `router.refresh()` after profile save.
- `app/onboarding/bank/page.tsx`: `router.refresh()` after bank save (with retry).
- `app/onboarding/accept-terms/page.tsx`: `router.refresh()` after accept.

## DB Call Counts per Step (from code)
- **Onboarding guard** (`/onboarding`):
  - `getServerSession()`
  - `prisma.user.findUnique()` (1)
  - `getOnboardingStatus()` → `$transaction` (3 queries)
- **Personal fetch** (`/api/onboarding/profile` GET):
  - `user.findUnique()` + `personProfile.findUnique()` (2 queries)
- **Personal submit** (`/api/onboarding/profile` POST):
  - `user.findUnique()` + `personProfile.findUnique()` + `personProfile.upsert()` (3 queries)
- **Bank submit** (`/api/onboarding/bank` POST):
  - `user.findUnique()` + `bankAccount.upsert()` (2 queries)
- **Terms accept** (`/api/onboarding/accept-terms` POST):
  - `user.findUnique()` + `userOnboarding.upsert()` (2 queries)

## Instrumentation Added (DEBUG_PERF=1)
### Server-side logs
- `perf:onboarding_guard` (app/onboarding/page.tsx)
  - fields: route, action, stepParam, desiredStep, sessionMs, userMs, onboardingMs, totalMs
- `perf:onboarding_status` (lib/onboardingStatus.ts)
  - fields: userId, ms, queries=3, hasIdDocument, hasProfile, hasBankAccount, termsAccepted
- `perf:onboarding_profile` (app/api/onboarding/profile/route.ts)
  - fields: method, action, userId, ms, queries
- `perf:onboarding_bank` (app/api/onboarding/bank/route.ts)
  - fields: method, action, userId, ms, queries
- `perf:onboarding_terms` (app/api/onboarding/accept-terms/route.ts)
  - fields: method, action, userId, ms, queries
- `perf:dashboard` (app/dashboard/page.tsx)
  - fields: sessionMs, userMs, onboardingMs, membershipMs, txnMs, movementsCount, totalMs

### Client-side logs (NEXT_PUBLIC_DEBUG_PERF=1)
- `perf:onboarding_click` (OCR/Personal/Bank/Terms)
  - fields: step, t
- `perf:onboarding_render` (OnboardingClient)
  - fields: step, from, deltaMs

## How to enable instrumentation
- Server: set `DEBUG_PERF=1`
- Client: set `NEXT_PUBLIC_DEBUG_PERF=1`

## Recommended Fixes (ordered by impact/effort)
1) **Reduce server guard work on every refresh**
   - Cache onboarding status per request or avoid repeated refreshes.
2) **Replace full `router.refresh()` with local state updates**
   - After POST, update client state and let server guard run only when needed.
3) **Minimize redirects between steps**
   - Avoid step mismatch redirects by ensuring the client only renders the correct step.
4) **Reduce frequency of dashboard refresh/polling**
   - Lower refresh intervals or use conditional polling for active sessions.
5) **Align regions**
   - Ensure Vercel and Supabase are in the same region to reduce RTT.

## Remove-in-one-commit instrumentation approach
- All perf logs are gated by `DEBUG_PERF` / `NEXT_PUBLIC_DEBUG_PERF`.
- To remove, revert the single instrumentation commit touching:
  - `app/onboarding/page.tsx`
  - `lib/onboardingStatus.ts`
  - `app/onboarding/OnboardingClient.tsx`
  - `app/onboarding/ocr/page.tsx`
  - `app/onboarding/personal/page.tsx`
  - `app/onboarding/bank/page.tsx`
  - `app/onboarding/accept-terms/page.tsx`
  - `app/api/onboarding/profile/route.ts`
  - `app/api/onboarding/bank/route.ts`
  - `app/api/onboarding/accept-terms/route.ts`
  - `app/dashboard/page.tsx`
