# Sales Tracker Nuxt Translation (Nuxt 3 + MySQL)

This folder is a JavaScript/TypeScript translation of the Streamlit app workflow.

## Included

- Nuxt 3 app UI for:
  - dashboard KPIs and status breakdown
  - pipeline create/list/filter/toggle/delete
  - team summary metrics
  - COI create/list/filter/delete
  - blog inputs
  - AI draft generation
  - AI final-post generation
  - saved input history
  - separate draft/final saved post lists
  - restore, pin/unpin, delete, duplicate final-to-draft
- Server API routes under `server/api/blog/*`, `server/api/pipeline/*`, `server/api/coi/*`, `server/api/dashboard/*`, and `server/api/team/*`
- MySQL schema via Prisma in `prisma/schema.prisma`
- Session auth with tenant-scoped data ownership (per user)
- Import scripts for `app_config.json` and workbook data

## Setup

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` to your MySQL connection string.
3. Set `OPENAI_API_KEY` (optional but recommended).
4. Set bootstrap auth credentials (`ADMIN_EMAIL`, `ADMIN_PASSWORD`).
5. Install dependencies:

```bash
npm install --ignore-scripts
```

6. Prepare Nuxt types (non-interactive):

```bash
NUXT_TELEMETRY_DISABLED=1 npx nuxt prepare
```

PowerShell equivalent:

```powershell
$env:NUXT_TELEMETRY_DISABLED='1'; npx nuxt prepare
```

7. Generate Prisma client:

```bash
npm run prisma:generate
```

8. Create and apply migration:

```bash
npm run prisma:migrate -- --name init
```

9. Create the initial admin user:

```bash
npm run auth:create-admin
```

10. Optionally import legacy data:

```bash
npm run import:app-config -- ../sales-tracker-app/app_config.json
npm run import:workbook -- "Data/Sales Tracker VsCode.xlsx"
```

11. Start dev server:

```bash
npm run dev
```

If `DATABASE_URL` is not set, API routes will return `500` because Prisma cannot initialize.

## API Endpoints

- `GET /api/blog/inputs`
- `POST /api/blog/inputs`
- `DELETE /api/blog/inputs/:id`
- `GET /api/blog/posts?kind=draft|final&search=&pinnedOnly=true|false`
- `POST /api/blog/posts`
- `PATCH /api/blog/posts/:id`
- `DELETE /api/blog/posts/:id`
- `POST /api/blog/generate/draft`
- `POST /api/blog/generate/final`
- `GET /api/dashboard/metrics`
- `GET /api/team/summary`
- `GET /api/pipeline`
- `POST /api/pipeline`
- `PATCH /api/pipeline/:id`
- `DELETE /api/pipeline/:id`
- `GET /api/coi`
- `POST /api/coi`
- `PATCH /api/coi/:id`
- `DELETE /api/coi/:id`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

## Migration Notes

Current status:

- Auth and user multi-tenancy: implemented
- Legacy `app_config.json` import: implemented
- Workbook import to MySQL: implemented
- Core pages (dashboard, pipeline, team, COI, and blog): translated
