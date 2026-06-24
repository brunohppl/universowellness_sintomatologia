# Sintomatologia — Universo Wellness

Digital replacement for the paper "Sintomatologia Dolorosa" form. Factory workers tap an
interactive front/back body diagram to report discomfort; HR/health staff get a dashboard
with filters, charts, CSV export, and a Supabase fallback for raw data access.

All user-facing text is in Brazilian Portuguese. This document is in English for setup purposes.

## How it's built

- **Frontend:** React + Vite + Tailwind CSS (static site, no server needed)
- **Database/Auth:** Supabase (Postgres table + Supabase Auth for the admin login)
- **Hosting:** Vercel (recommended) — deploys straight from a GitHub repo
- **Charts/CSV:** Recharts, client-side CSV export (Excel-compatible, UTF-8 with BOM)

Two routes:
- `/` — the worker-facing form (public, no login)
- `/admin` — the staff dashboard (requires Supabase Auth login at `/admin/login`)

## 1. Set up Supabase (one-time)

> **Already have this project running from before?** The SQL below is safe to run again —
> it only adds what's new (the `empresas`/`filiais`/`setores` tables and two columns on
> `submissions`) without touching your existing data. Just paste the updated file in again.

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** → New query → paste the entire contents of
   [`supabase/schema.sql`](./supabase/schema.sql) → **Run**.
   This creates the `submissions` table, indexes, and Row Level Security policies:
   - Anyone (the public form) can **insert** a row.
   - Only **authenticated** users (staff) can **read** rows.
   - Nobody can update/delete through the API — this protects the historical record.
     If you ever need to fix a typo in a record, do it via the Supabase **Table Editor**
     while logged in as project owner (that bypasses RLS).
3. Create at least one staff login: **Authentication → Users → Add user**, set an email
   and password. Use this to log into `/admin/login`. Add one user per staff member who
   needs access.
4. Get your API credentials: **Project Settings → API** → copy the **Project URL** and
   the **anon public** key (not the `service_role` key — never expose that one).

## 2. Configure the app

```bash
cp .env.example .env
```

Edit `.env` and paste your Supabase URL and anon key:

```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## 3. Run it locally

```bash
npm install
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`). Try submitting a test entry on
`/`, then log into `/admin` with the staff account you created.

## 4. Deploy to Vercel

1. Push this folder to a GitHub repository (private is fine).
2. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import that repo.
3. Vercel auto-detects Vite. Before deploying, add the two environment variables under
   **Settings → Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy. You'll get a URL like `https://universo-sintomatologia.vercel.app` —
   put this on a tablet/kiosk on the factory floor for workers to use, and share `/admin`
   with HR/health & safety staff.

`vercel.json` is already included so that refreshing `/admin` doesn't 404 (single-page app
routing).

> **Using Render instead?** It works too: create a "Static Site", build command
> `npm install && npm run build`, publish directory `dist`, and add the same two
> environment variables. You'll need an equivalent rewrite rule (`/* → /index.html`) in
> Render's settings, since this is a single-page app.

## How the data model works

Each submission is one row in `submissions`:

| Column          | Meaning                                                              |
|------------------|------------------------------------------------------------------------|
| `nome`           | Worker's name                                                          |
| `matricula`      | Employee ID / "CR" from the original form (optional)                   |
| `setor`          | Department                                                              |
| `data_registro`  | Date of the report                                                     |
| `areas_dor`      | Array of integers 1–10 (see below) — empty array means "no discomfort" |
| `observacoes`    | Optional free-text note                                                |
| `empresa_id`     | Which client this came from (null = generic `/` test form)             |
| `filial_id`      | Which branch this came from (null = generic `/` test form)             |
| `created_at`     | Submission timestamp (set automatically)                               |

Three more tables support multi-client setup, all managed through `/admin/clientes`:

- **`empresas`** — client companies (Coca-Cola, Gillette, ...), with an optional logo URL.
- **`filiais`** — each client's branches/locations, each with a unique `slug` that becomes its public link (`/f/<slug>`).
- **`setores`** — the department list, scoped per client, replacing the old hardcoded suggestions.

The 10 area codes match the original paper form exactly, defined in
`src/data/painAreas.js`:

```
1 Cabeça · 2 Pescoço · 3 Ombro · 4 Braço e antebraço · 5 Costas alta (dorsais)
6 Costas baixa (lombares) · 7 Mão e punho · 8 Coxa e joelho · 9 Perna · 10 Pé e tornozelo
```

The clickable body shapes (front + back) live in `src/data/bodyShapes.js` — each shape
maps to one of those 10 codes, so the visual regions and the stored data always stay in sync.

## Customizing

- **Clients, branches, departments:** now managed entirely through `/admin/clientes` — no code changes needed.
- **Colors/branding:** edit the `teal` / `coral` / `leaf` palette in `tailwind.config.js`.
- **Body diagram:** the silhouette and tap markers live in `src/data/bodyShapes.js`.
- **More staff accounts:** add them anytime in Supabase Authentication — no app changes needed.

## Setting up clients, branches, and department lists

Since this app now serves multiple client companies (not just one factory), there's a setup step before workers can use it:

1. Log into `/admin`, then click **Clientes** in the header.
2. Click **Criar cliente** and add a company (e.g. "Coca-Cola"). The logo field takes a direct image URL — there's no upload yet (see "Ideas for later" below).
3. Click into that client to expand it, then add at least one **filial** (branch/location) and a few **setores** (departments) — these replace the old hardcoded department suggestions, and are now fully editable per client.
4. Each filial gets a unique link shown right there (`yoursite.com/f/coca-cola-sao-paulo`) — click **Copiar link** and that's what you put on that branch's tablet/kiosk. Each branch's form automatically shows that client's logo and department list.

The plain `/` link still works as a generic/test form (original Universo Wellness branding, free-text department field) — useful for testing without needing a client set up, and it keeps any bookmarks/links you were already using before this update.

If you remove a client or branch that already has submitted records, the database will refuse the delete (rather than silently orphaning that data) — you'll see a message explaining that instead of an error.

## Reports

The dashboard now has two export options side by side:

- **Exportar CSV** — same as before, now with added Cliente/Filial columns.
- **Exportar relatório (PDF)** — a formatted report with the applied filters listed, summary stat cards, two redrawn bar charts (not a screenshot — drawn directly, so they stay crisp and don't depend on fonts rendering correctly in a captured image), a short written summary auto-generated from the real numbers (no AI text generation involved — it's a template filling in your actual stats, so it can't say anything not backed by the data), and the detailed table (first 200 rows; CSV remains the way to get everything beyond that).

Both respect whatever filters are currently set on the dashboard (date range, client, branch, department, area).



Per your request, staff can also browse and export data directly in Supabase: log into
your project, go to **Table Editor → submissions**. The dashboard in this app links there
too, in case anyone needs to cross-reference data, build a custom view, or run SQL.

## Ideas for later (not built yet)

- Logo upload for clients (currently a pasted image URL) via Supabase Storage
- Per-client admin logins (today, only Universo Wellness staff manage clients/branches/departments — by design)
- Severity/intensity scale per area (e.g. 1–5) instead of just yes/no
- An AI-generated narrative summary as an alternative to the template-based one in the PDF (would need a small backend function holding an API key, since that can't run safely in the browser)
- Scheduled email digest per client
- Kiosk/tablet "lock" mode so workers can't navigate away from the form
- Multi-language toggle, if a branch has non-Portuguese-speaking staff
