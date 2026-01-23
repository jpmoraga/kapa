# Email Troubleshoot (Resend)

## Quick checks
1) **Domain verified**: `EMAIL_FROM` domain is verified in Resend.
2) **API key**: `RESEND_API_KEY` is a production key (not sandbox).
3) **Vercel envs**: `RESEND_API_KEY` + `EMAIL_FROM` are present in the correct environment (preview/prod).
4) **Redirect host**: `NEXT_PUBLIC_SITE_URL` (preferred) or `NEXT_PUBLIC_APP_URL` points to the expected host (never localhost in prod).

## Debug endpoint
```
GET /api/debug/email
```
Expected:
- `hasResendKey: true`
- `hasEmailFrom: true`
- `emailFrom` matches verified domain
- `siteUrlUsed` is correct for the environment

## What to log
Grep for:
```
auth:resend
```
It should include `siteUrlUsed`, `resendFrom`, and `messageId`.

## Common causes
- `EMAIL_FROM` not verified in Resend
- Sandbox key used in production
- Wrong `NEXT_PUBLIC_SITE_URL` (points to localhost / ngrok)
