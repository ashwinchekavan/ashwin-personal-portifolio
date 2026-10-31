# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
npm run db:local       # temporary MySQL 8.4 on 127.0.0.1:3307 (user root, no password, db "portfolio"); data is erased on stop
npm run dev            # Astro dev server, http://localhost:4321 (admin at /admin/ when ADMIN_HOST is empty)
npm run build          # builds the standalone Node server into dist/
npm run start          # runs dist/server/entry.mjs, loading .env if present
npm run hash-password  # prints ADMIN_PASSWORD_HASH=scrypt:<salt>:<hash>
```

There is no test suite or linter. Node >= 22.12 is required. Copy `.env.example` to `.env` for local work; README.md lists the local values (note `DB_PORT=3307` for `db:local`).

## Architecture

Astro 7 in `output: 'server'` mode with the `@astrojs/node` standalone adapter: every page is rendered on request, nothing is prerendered. A personal portfolio site plus a single-admin blog whose posts live in MySQL.

- **Environment is read at runtime via `process.env`**, not `import.meta.env`, so settings (including `SITE_URL`) can change without a rebuild. `astro.config.mjs` calls `process.loadEnvFile()` for dev/build. Use `url()` / `fullUrl()` from `src/config.ts` for internal links; that file also holds all site-wide text and links.
- **Database** (`src/lib/db.ts`): one `mysql2` pool cached on `globalThis` (survives dev reloads). The first `query()` runs `db/schema.sql` (imported with `?raw`, uses `CREATE TABLE IF NOT EXISTS`), so there are no migrations: schema changes must be written so re-running the file on an existing database is safe. Dates are UTC (`timezone: 'Z'`, `UTC_TIMESTAMP()`). `DB_HOST` must be `127.0.0.1`, not `localhost` (Hostinger IPv6 issue).
- **Posts** (`src/lib/posts.ts`): all post reads/writes go through here. `normalise()` sanitizes editor input (`src/lib/sanitize.ts` allowlist must match what the TipTap editor in `src/components/Editor.astro` can produce). The slug is set once on creation and never changes on edit. Public pages use `listPublishedOrEmpty()` so they still render when the DB is down. API routes throw/catch `InvalidPost` for 400 responses.
- **Auth and admin host** (`src/middleware.ts`, `src/lib/auth.ts`): single admin account from env (`ADMIN_USERNAME`, scrypt `ADMIN_PASSWORD_HASH`), HMAC-signed stateless session cookie keyed by `SESSION_SECRET`, in-memory login rate limit. Middleware guards `/admin*` and `/api/admin/*`; when `ADMIN_HOST` is set, admin paths 404 on any other host and the admin host serves only admin paths plus `/_astro`, `/_image`, `/uploads`, `/favicon.svg`. Astro's `checkOrigin` is disabled; the middleware does its own Origin-vs-Host check (honouring `X-Forwarded-Host`) for non-GET admin requests.
- **Uploads** (`src/lib/uploads.ts`, `src/pages/uploads/[file].ts`): images are re-encoded to WebP via `sharp` with a UUID name into `UPLOAD_DIR`, and served from `/uploads/<uuid>.webp`. Covers must be such a path or an `https://` URL (`cleanImageUrl`).

## Deployment

Hosted on Hostinger as a Node.js web app built from GitHub (`main`); see DEPLOY.md. The app folder is replaced on every deploy, so anything persistent must live in MySQL or in `UPLOAD_DIR` outside the app folder. With an admin subdomain, the same app is deployed twice (main + admin) with identical env vars, including the same `SESSION_SECRET` and `UPLOAD_DIR`.
