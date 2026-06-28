# Backoffice Auth

## Scope
- New private backoffice under `/backoffice`.
- Separate session cookie: `kapa_backoffice_session`.
- Separate Prisma models: `BackofficeUser` and `BackofficeSession`.
- No dependency on `/admin`, `AdminUser`, or `AdminSession`.

## Create the first owner
Default owner target:
- email: `jp@lemonpot.com`
- role: `OWNER`

Recommended:
```bash
BACKOFFICE_OWNER_PASSWORD='replace-with-a-strong-password' npm run backoffice:create-owner
```

Optional env vars:
```bash
BACKOFFICE_OWNER_EMAIL='jp@lemonpot.com'
BACKOFFICE_OWNER_NAME='Juan Pablo'
BACKOFFICE_OWNER_PASSWORD='replace-with-a-strong-password'
```

The script reads `DIRECT_URL` first and falls back to `DATABASE_URL`. If `BACKOFFICE_OWNER_PASSWORD` is missing, it prompts for the password interactively.

## Login flow
1. Visit `/backoffice/login`.
2. Submit email + password to `POST /api/backoffice/login`.
3. Successful login stores the httpOnly cookie `kapa_backoffice_session`.
4. Protected routes under `/backoffice/*` redirect back to `/backoffice/login` when there is no valid active session.

## Logout
- `POST /api/backoffice/logout`
- Deletes the session row and clears the cookie.
