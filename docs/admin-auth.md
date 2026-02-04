# Admin Auth (cava.cl)

## Create the first admin
1) Set env vars (use `.env.local` if preferred):
```
ADMIN_EMAIL=admin@cava.cl
ADMIN_PASSWORD=your-strong-password
```

2) Run the script:
```
npx tsx -r dotenv/config scripts/create-admin.ts
```

The script upserts `AdminUser` with a bcrypt hash.

## Login
- Visit `/admin/login` and sign in with the admin credentials.
- Successful login creates a server session cookie (`admin_session`).

## API check
- `GET /api/admin/me` returns `{ email, role }` for logged-in admins.
- Returns `401` if no admin session.
