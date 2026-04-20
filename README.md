# Argo Growth — Operations Dashboard

Single-tenant, self-hosted web app that implements the Apr 2026 spec. Five pillars (CEO, Clients, CRM, Content Production, Financials), auth with three roles, mobile-responsive, PWA-ready, and all data in a local SQLite file that Aamish owns end-to-end.

## Stack

- **Next.js 15** (App Router, React 19) — single codebase, SPA feel, mobile-first.
- **SQLite** via `better-sqlite3` — one file at `db/argo.sqlite`, trivial to back up.
- **Tailwind CSS** — responsive styling.
- **@dnd-kit** — drag-and-drop for to-dos and kanban boards.
- **Recharts** — the revenue-per-month bar chart.
- **JWT** (`jose`) cookies for sessions, `bcryptjs` for password hashing.

## First-time setup

```bash
# 1. Install dependencies
npm install

# 2. Create an env file
cp .env.example .env
# then edit AUTH_SECRET to a long random string (openssl rand -hex 32)

# 3. Create the DB, admin user, and sample data
npm run seed
# Default login: admin@argo.local / argo2026  — change the password immediately.

# 4. Run in dev
npm run dev
# open http://localhost:3000

# 5. Build & run in production
npm run build
npm run start
```

## Deploying

Any Node host works (Render, Fly.io, Railway, a bare VPS). Persist the `db/` folder on a volume so the SQLite file survives deploys. Set:

- `AUTH_SECRET` — long random string for JWT signing.
- `DATABASE_PATH` — absolute path to the `.sqlite` file on the volume (e.g. `/data/argo.sqlite`).

For PWA: visit the site on mobile and choose "Add to Home Screen". Manifest is served at `/manifest.json`.

## Daily backup (automated)

The `npm run backup` script copies the live DB into `db/backups/argo-<timestamp>.sqlite` and keeps the last 30.

Wire it to cron:

```cron
# Daily at 03:00 local
0 3 * * * cd /path/to/argo && /usr/bin/env npm run backup >> db/backups/backup.log 2>&1
```

Copy that `db/backups/` directory off-box (S3, Backblaze, rsync to another server) on whatever cadence you're comfortable with.

## CSV export

Any table is exportable via `/api/export/<table>.csv`. Examples:

- `/api/export/clients.csv`
- `/api/export/prospects.csv`
- `/api/export/tasks.csv`
- `/api/export/content.csv`
- `/api/export/invoices.csv`
- `/api/export/resources.csv`

The Financials page has an "Export CSV" button wired up; the same URLs work from any logged-in admin/team session.

## Users & roles

Three roles, enforced in API routes and middleware:

- **Admin** (founder) — full access, manages users and clients, edits financials.
- **Team** — full access to Content Production; can edit content calendar, resources, and client status/notes but not the About tab or financials.
- **Viewer** — read-only access to specific client workspaces assigned to them.

Add/edit users at `/admin/users` (admin only). Assign clients to a viewer in the same UI.

## Pillars (where things live)

1. `/ceo` — live KPI strip, to-do list (drag-reorder, tags, due dates, filters), pipeline snapshot, client health strip.
2. `/clients/[id]` — About (auto-save), Content Calendar (month + list views, detail modal with script/performance), Resources, Tasks (scoped view of the to-do list).
3. `/crm` — 8-stage kanban, drag cards between stages. Card detail = full record + chronological notes log. "Closed Won" prompts to auto-create a pre-filled client workspace.
4. `/financials` — MRR/Collected/Outstanding/Overdue strip, invoice tracker, per-client summary, monthly bar chart. Overdue invoices auto-flagged on read.
5. `/production` — internal 5-stage kanban with per-client color coding, list view with filters, velocity bar (scripts-done-this-week / target you set).

## Data ownership & handoff

- All source code lives in this repo.
- All data lives in `db/argo.sqlite` (a single file).
- No third-party SaaS dependency.
- The 30-minute handoff call covers:
  - How to add a user.
  - How to export data (the `/api/export/*.csv` endpoints or the in-app button).
  - How to restore from a backup: stop the app, copy any `db/backups/argo-<timestamp>.sqlite` back to `db/argo.sqlite`, restart.
  - Where credentials live (env vars) and how to rotate `AUTH_SECRET` (sessions invalidate, everyone signs in again).

## Common edits

- **Change weekly script target** — on the Content Production page, the number next to the velocity bar.
- **Reset a password** — delete and recreate the user at `/admin/users`, or update `password_hash` directly in the SQLite DB (`bcrypt` hash).
- **Change pipeline stages** — edit `PROSPECT_STAGES` in `lib/types.ts`. If you add a new stage, existing prospects keep their old stage value until moved.
- **Add a new field** — add to the SQLite schema in `lib/db.ts`, update `lib/types.ts`, expose it in the relevant API route and UI component.
